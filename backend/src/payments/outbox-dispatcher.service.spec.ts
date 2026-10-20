import { OutboxDispatcherService } from './outbox-dispatcher.service';

describe('OutboxDispatcherService', () => {
  const event = {
    id: 'event-1',
    eventType: 'ORDER_PAID_EMAIL',
    aggregateId: 'order-1',
    attempts: 1,
  };
  const order = {
    id: 'order-1',
    orderNumber: 'HR-1',
    shippingEmail: 'buyer@example.com',
    shippingName: 'Buyer',
    shippingPhone: '+2348000000000',
    total: 250000,
    items: [],
  };

  it('marks an event processed after successful delivery', async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(order) },
      outboxEvent: { update: jest.fn().mockResolvedValue({}) },
    };
    const notifications = {
      sendOrderConfirmationEmail: jest
        .fn()
        .mockResolvedValue({ success: true }),
      sendWhatsAppNotification: jest.fn(),
    };
    const service = new OutboxDispatcherService(
      prisma as any,
      notifications as any,
    );
    jest
      .spyOn(service as any, 'claimNextEvent')
      .mockResolvedValueOnce(event)
      .mockResolvedValueOnce(null);

    await expect(service.processPendingEvents()).resolves.toEqual({
      processed: 1,
    });
    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: expect.objectContaining({ status: 'PROCESSED', lockedAt: null }),
    });
  });

  it('persists the error and schedules a retry when delivery fails', async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(order) },
      outboxEvent: { update: jest.fn().mockResolvedValue({}) },
    };
    const notifications = {
      sendOrderConfirmationEmail: jest
        .fn()
        .mockResolvedValue({ success: false, error: 'provider unavailable' }),
      sendWhatsAppNotification: jest.fn(),
    };
    const service = new OutboxDispatcherService(
      prisma as any,
      notifications as any,
    );
    jest
      .spyOn(service as any, 'claimNextEvent')
      .mockResolvedValueOnce(event)
      .mockResolvedValueOnce(null);

    await expect(service.processPendingEvents()).resolves.toEqual({
      processed: 0,
    });
    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: event.id },
      data: expect.objectContaining({
        status: 'PENDING',
        lockedAt: null,
        lastError: 'provider unavailable',
        availableAt: expect.any(Date),
      }),
    });
  });
});
