import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const OUTBOX_POLL_INTERVAL_MS = 5_000;
const OUTBOX_STALE_LOCK_MS = 5 * 60_000;
const OUTBOX_BATCH_SIZE = 20;

@Injectable()
export class OutboxDispatcherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxDispatcherService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return;

    void this.dispatchSafely();
    this.timer = setInterval(
      () => void this.dispatchSafely(),
      OUTBOX_POLL_INTERVAL_MS,
    );
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async dispatchSafely() {
    try {
      await this.processPendingEvents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown dispatcher error';
      this.logger.error(`Outbox polling failed: ${message}`);
    }
  }

  async processPendingEvents(limit = OUTBOX_BATCH_SIZE) {
    if (this.running) return { processed: 0 };
    this.running = true;
    let processed = 0;

    try {
      for (let index = 0; index < limit; index++) {
        const event = await this.claimNextEvent();
        if (!event) break;

        try {
          await this.deliver(event.eventType, event.aggregateId);
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'PROCESSED',
              processedAt: new Date(),
              lockedAt: null,
              lastError: null,
            },
          });
          processed++;
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : 'Unknown outbox delivery error';
          const retryDelayMs = Math.min(
            60 * 60_000,
            5_000 * 2 ** Math.min(event.attempts, 10),
          );
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: 'PENDING',
              availableAt: new Date(Date.now() + retryDelayMs),
              lockedAt: null,
              lastError: message.slice(0, 2_000),
            },
          });
          this.logger.error(`Outbox event ${event.id} failed: ${message}`);
        }
      }
    } finally {
      this.running = false;
    }

    return { processed };
  }

  private claimNextEvent() {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - OUTBOX_STALE_LOCK_MS);

    return this.prisma.$transaction(async (tx) => {
      const candidate = await tx.outboxEvent.findFirst({
        where: {
          availableAt: { lte: now },
          OR: [
            { status: 'PENDING' },
            { status: 'PROCESSING', lockedAt: { lt: staleBefore } },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!candidate) return null;

      const claim = await tx.outboxEvent.updateMany({
        where: {
          id: candidate.id,
          availableAt: { lte: now },
          OR: [
            { status: 'PENDING' },
            { status: 'PROCESSING', lockedAt: { lt: staleBefore } },
          ],
        },
        data: {
          status: 'PROCESSING',
          lockedAt: now,
          attempts: { increment: 1 },
        },
      });
      if (claim.count !== 1) return null;

      return tx.outboxEvent.findUniqueOrThrow({ where: { id: candidate.id } });
    });
  }

  private async deliver(eventType: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { variant: { include: { product: true } } } },
      },
    });
    if (!order) throw new Error(`Order ${orderId} no longer exists`);

    if (eventType === 'ORDER_PAID_EMAIL') {
      const result = await this.notifications.sendOrderConfirmationEmail(order);
      if (!result.success) {
        throw new Error(result.error || 'Order confirmation email failed');
      }
      return;
    }

    if (eventType === 'ORDER_PAID_WHATSAPP') {
      await this.notifications.sendWhatsAppNotification(
        order.shippingPhone || '',
        `Hi ${order.shippingName}! Your payment for order ${order.orderNumber} of amount ₦${(order.total / 100).toLocaleString()} has been verified successfully. We are preparing it for delivery!`,
      );
      return;
    }

    throw new Error(`Unsupported outbox event type: ${eventType}`);
  }
}
