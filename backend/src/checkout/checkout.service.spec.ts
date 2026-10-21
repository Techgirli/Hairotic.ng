import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CheckoutService } from './checkout.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CheckoutService', () => {
  let service: CheckoutService;

  const mockTransaction: any = {
    $queryRaw: jest
      .fn()
      .mockResolvedValue([{ id: 'inventory-1', quantity: 3 }]),
    inventory: { update: jest.fn() },
    order: {
      create: jest.fn().mockResolvedValue({ id: 'order-1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'order-1' }),
    },
    orderItem: { create: jest.fn() },
    orderStatusHistory: { create: jest.fn() },
    cartItem: { deleteMany: jest.fn() },
    cart: { update: jest.fn() },
  };

  const mockPrismaService: any = {
    order: { findUnique: jest.fn().mockResolvedValue(null) },
    cart: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'cart-1',
        updatedAt: new Date('2026-10-15T00:00:00.000Z'),
        items: [
          {
            productVariantId: 'variant-1',
            quantity: 1,
            variant: { price: 12000000, sku: 'HAIR-1' },
          },
        ],
      }),
    },
    $transaction: jest.fn((callback: (tx: any) => unknown) =>
      callback(mockTransaction),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.order.findUnique.mockResolvedValue(null);
    mockPrismaService.cart.findFirst.mockResolvedValue({
      id: 'cart-1',
      updatedAt: new Date('2026-10-15T00:00:00.000Z'),
      items: [
        {
          productVariantId: 'variant-1',
          quantity: 1,
          variant: { price: 12000000, sku: 'HAIR-1' },
        },
      ],
    });
    mockTransaction.$queryRaw.mockResolvedValue([
      { id: 'inventory-1', quantity: 3 },
    ]);
    mockTransaction.order.create.mockResolvedValue({ id: 'order-1' });
    mockTransaction.order.findUnique.mockResolvedValue({ id: 'order-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckoutService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CheckoutService>(CheckoutService);
  });

  it('stores uncapped delivery fees separately from the online payment total', async () => {
    await service.createOrder(undefined, 'session-1', {
      shippingAddress: {
        name: 'Customer',
        email: 'customer@example.com',
        phone: '+2348000000000',
        state: 'Lagos',
        lga: 'Ikeja',
        street: '1 Main Street',
        deliveryInstructions: 'Blue gate beside the pharmacy',
      },
      deliveryFeeNgn: 12000,
      deliveryFeeAcknowledged: true,
      idempotencyKey: 'checkout-1',
    });

    expect(mockTransaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 12000000,
          deliveryFee: 1200000,
          total: 12000000,
          shippingInstructions: 'Blue gate beside the pharmacy',
        }),
      }),
    );
  });

  it('defaults an unspecified delivery fee to zero', async () => {
    await service.createOrder(undefined, 'session-1', {
      shippingAddress: {
        name: 'Customer',
        email: 'customer@example.com',
        phone: '+2348000000000',
        state: 'Lagos',
        lga: 'Ikeja',
        street: '1 Main Street',
      },
      idempotencyKey: 'checkout-no-fee',
    });

    expect(mockTransaction.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deliveryFee: 0,
          total: 12000000,
        }),
      }),
    );
  });

  it('rejects invalid delivery fee amounts', async () => {
    await expect(
      service.createOrder(undefined, 'session-1', {
        shippingAddress: {
          name: 'Customer',
          email: 'customer@example.com',
          phone: '+2348000000000',
          state: 'Lagos',
          lga: 'Ikeja',
          street: '1 Main Street',
        },
        deliveryFeeNgn: -1,
        deliveryFeeAcknowledged: true,
        idempotencyKey: 'checkout-2',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });

  it('requires acknowledgement that delivery is paid on delivery', async () => {
    await expect(
      service.createOrder(undefined, 'session-1', {
        shippingAddress: {
          name: 'Customer',
          email: 'customer@example.com',
          phone: '+2348000000000',
          state: 'Lagos',
          lga: 'Ikeja',
          street: '1 Main Street',
        },
        deliveryFeeNgn: 12000,
        deliveryFeeAcknowledged: false,
        idempotencyKey: 'checkout-3',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
  });
});
