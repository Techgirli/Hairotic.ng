import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService hardening', () => {
  const order = {
    id: 'order-1',
    orderNumber: 'HR-1',
    customerId: 'customer-1',
    checkoutSessionId: null,
    status: OrderStatus.PENDING_PAYMENT,
    total: 250000,
    shippingEmail: 'buyer@example.com',
    customer: { email: 'buyer@example.com' },
    items: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYMENTS_MOCK_MODE = 'true';
    delete process.env.PAYSTACK_SECRET_KEY;
    process.env.NODE_ENV = 'test';
  });

  it('does not let another customer initialize payment for an order', async () => {
    const prisma = { order: { findUnique: jest.fn().mockResolvedValue(order) } };
    const service = new PaymentsService(prisma as any);

    await expect(
      service.initializeTransaction(order.id, 'attacker-id'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a successful provider event whose amount does not match the order', () => {
    const service = new PaymentsService({} as any);

    expect(() =>
      (service as any).assertPaymentMatchesOrder(
        { reference: order.orderNumber, amount: order.total - 1, currency: 'NGN' },
        order,
      ),
    ).toThrow(BadRequestException);
  });

  it('fulfills an order once when verification paths race or retry', async () => {
    const tx = {
      order: {
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValueOnce({ count: 0 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ ...order, status: OrderStatus.PAID }),
        findUnique: jest.fn().mockResolvedValue({ ...order, status: OrderStatus.PAID }),
      },
      payment: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn().mockResolvedValue({ status: PaymentStatus.SUCCESS }),
      },
      orderStatusHistory: { create: jest.fn().mockResolvedValue({}) },
      outboxEvent: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };
    const prisma = {
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const service = new PaymentsService(prisma as any);

    await (service as any).fulfillOrder(order.id, order.orderNumber);
    await (service as any).fulfillOrder(order.id, order.orderNumber);

    expect(tx.payment.create).toHaveBeenCalledTimes(1);
    expect(tx.orderStatusHistory.create).toHaveBeenCalledTimes(1);
    expect(tx.outboxEvent.createMany).toHaveBeenCalledTimes(1);
    expect(tx.outboxEvent.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          eventType: 'ORDER_PAID_EMAIL',
          deduplicationKey: `order-paid-email:${order.id}`,
        }),
        expect.objectContaining({
          eventType: 'ORDER_PAID_WHATSAPP',
          deduplicationKey: `order-paid-whatsapp:${order.id}`,
        }),
      ]),
      skipDuplicates: true,
    });
  });

  it('claims a successful payment before issuing a refund', async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          ...order,
          status: OrderStatus.PAID,
          payments: [{ id: 'payment-1', status: PaymentStatus.SUCCESS, paystackReference: order.orderNumber }],
        }),
      },
      payment: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    const service = new PaymentsService(prisma as any);

    await expect(service.refundTransaction(order.id, 'duplicate')).rejects.toThrow(
      'Refund is already in progress or completed',
    );
  });
});
