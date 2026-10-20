import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  async initializeTransaction(
    orderId: string,
    customerId?: string,
    sessionId?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const ownsOrder = order.customerId
      ? order.customerId === customerId
      : Boolean(sessionId && order.checkoutSessionId === sessionId);
    if (!ownsOrder) {
      throw new ForbiddenException(
        'You cannot initialize payment for this order',
      );
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is already paid or cancelled');
    }

    const paystackSecret = this.getPaystackSecret();

    const baseUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      'http://localhost:3000';

    if (!paystackSecret) {
      this.logger.warn('Using explicitly enabled local mock payment flow.');

      // Local development mock mode: return success callback instantly
      return {
        authorization_url: `${baseUrl}/checkout/success?orderNumber=${order.orderNumber}`,
        reference: order.orderNumber,
        isMock: true,
      };
    }

    try {
      const email =
        order.shippingEmail || order.customer?.email || 'guest@hairotic.ng';

      const response = await fetch(
        'https://api.paystack.co/transaction/initialize',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: order.total, // already in kobo
            reference: order.orderNumber,
            callback_url: `${baseUrl}/checkout/success?orderNumber=${order.orderNumber}`,
          }),
        },
      );

      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Initialization failed');
      }

      return {
        authorization_url: result.data.authorization_url,
        reference: result.data.reference,
        isMock: false,
      };
    } catch (err: any) {
      this.logger.error(
        `Failed to initialize Paystack transaction: ${err.message}`,
      );
      throw new BadRequestException(
        `Paystack initialization failed: ${err.message}`,
      );
    }
  }

  async verifyTransaction(reference: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: reference },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const paystackSecret = this.getPaystackSecret();

    // Handle mock verification for local development
    if (!paystackSecret) {
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        await this.fulfillOrder(order.id, reference);
      }
      return { status: 'success', reference, isMock: true };
    }

    try {
      const response = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Verification check failed');
      }

      if (result.data.status === 'success') {
        this.assertPaymentMatchesOrder(result.data, order);
        await this.fulfillOrder(order.id, reference);
      }

      return result.data;
    } catch (err: any) {
      this.logger.error(
        `Failed to verify transaction ${reference}: ${err.message}`,
      );
      throw new BadRequestException(
        `Verification check failed: ${err.message}`,
      );
    }
  }

  async handleWebhook(signature: string, rawBody: string) {
    const paystackSecret = this.getPaystackSecret();

    if (!paystackSecret) {
      this.logger.warn(
        'Webhook ignored while explicit local mock payment mode is enabled.',
      );
      return { status: 'ignored' };
    }

    // Verify webhook signature in constant time to prevent timing attacks
    const hash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    const hashBuffer = Buffer.from(hash, 'hex');
    if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) {
      throw new UnauthorizedException('Invalid signature');
    }
    const sigBuffer = Buffer.from(signature, 'hex');

    if (
      hashBuffer.length !== sigBuffer.length ||
      !crypto.timingSafeEqual(hashBuffer, sigBuffer)
    ) {
      throw new UnauthorizedException('Invalid signature');
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === 'charge.success') {
      const reference = payload.data.reference;
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: reference },
      });

      if (order && order.status === OrderStatus.PENDING_PAYMENT) {
        this.assertPaymentMatchesOrder(payload.data, order);
        await this.fulfillOrder(order.id, reference);
        this.logger.log(
          `Webhook successfully fulfilled order reference: ${reference}`,
        );
      }
    }

    return { status: 'success' };
  }

  private async fulfillOrder(orderId: string, reference: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Only one caller may transition the order. Concurrent webhook, callback,
      // and reconciliation requests become successful no-ops after the winner.
      const transition = await tx.order.updateMany({
        where: { id: orderId, status: OrderStatus.PENDING_PAYMENT },
        data: { status: OrderStatus.PAID },
      });

      if (transition.count === 0) {
        const existingPayment = await tx.payment.findUnique({
          where: { paystackReference: reference },
        });
        if (existingPayment?.status === PaymentStatus.SUCCESS) {
          const existingOrder = await tx.order.findUnique({
            where: { id: orderId },
            include: {
              items: { include: { variant: { include: { product: true } } } },
            },
          });
          return { order: existingOrder, newlyFulfilled: false };
        }
        throw new BadRequestException('Order is not awaiting payment');
      }

      const updatedOrder = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });

      // 2. Create Payment log
      await tx.payment.create({
        data: {
          orderId,
          paystackReference: reference,
          status: PaymentStatus.SUCCESS,
          amount: updatedOrder.total,
          verifiedAt: new Date(),
        },
      });

      // 3. Record Order Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.PAID,
          note: 'Payment verified successfully via Paystack.',
          changedBy: 'PAYSTACK_WEBHOOK',
        },
      });

      await tx.outboxEvent.createMany({
        data: [
          {
            eventType: 'ORDER_PAID_EMAIL',
            aggregateId: orderId,
            deduplicationKey: `order-paid-email:${orderId}`,
          },
          {
            eventType: 'ORDER_PAID_WHATSAPP',
            aggregateId: orderId,
            deduplicationKey: `order-paid-whatsapp:${orderId}`,
          },
        ],
        skipDuplicates: true,
      });

      return { order: updatedOrder, newlyFulfilled: true };
    });
    return result.order;
  }

  async refundTransaction(orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (
      order.status !== OrderStatus.PAID &&
      order.status !== OrderStatus.PROCESSING &&
      order.status !== OrderStatus.SHIPPED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Order cannot be refunded in its current status',
      );
    }

    const successfulPayment = order.payments.find(
      (p) => p.status === PaymentStatus.SUCCESS,
    );
    if (!successfulPayment) {
      throw new BadRequestException(
        'No successful payment found for this order',
      );
    }

    const paystackSecret = this.getPaystackSecret();

    const claimed = await this.prisma.payment.updateMany({
      where: {
        id: successfulPayment.id,
        status: PaymentStatus.SUCCESS,
      },
      data: { status: PaymentStatus.PENDING },
    });
    if (claimed.count !== 1) {
      throw new BadRequestException(
        'Refund is already in progress or completed',
      );
    }

    if (!paystackSecret) {
      this.logger.warn('Using explicitly enabled local mock refund flow.');
      await this.processRefundFulfillment(
        order.id,
        successfulPayment.paystackReference,
      );
      return {
        status: 'mock_refunded',
        reference: successfulPayment.paystackReference,
      };
    }

    let refundAccepted = false;
    try {
      const response = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: successfulPayment.paystackReference,
          amount: order.total,
          customer_note: reason,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Refund request failed');
      }
      refundAccepted = true;

      await this.processRefundFulfillment(
        order.id,
        successfulPayment.paystackReference,
      );
      return result.data;
    } catch (err: any) {
      if (!refundAccepted) {
        await this.prisma.payment.updateMany({
          where: {
            id: successfulPayment.id,
            status: PaymentStatus.PENDING,
          },
          data: { status: PaymentStatus.SUCCESS },
        });
      }
      this.logger.error(
        `Failed to refund transaction ${successfulPayment.paystackReference}: ${err.message}`,
      );
      throw new BadRequestException(`Refund failed: ${err.message}`);
    }
  }

  private async processRefundFulfillment(orderId: string, reference: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Order status to REFUNDED
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.REFUNDED },
      });

      // 2. Update Payment log to REFUNDED
      await tx.payment.update({
        where: { paystackReference: reference },
        data: { status: PaymentStatus.REFUNDED },
      });

      // 3. Record Order Status History
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: OrderStatus.REFUNDED,
          note: 'Refund processed successfully.',
          changedBy: 'ADMIN_REFUND',
        },
      });
    });
  }

  /**
   * Reconciliation job — called by the GitHub Actions cron every 10 minutes.
   *
   * Finds all orders stuck in PENDING_PAYMENT for more than 10 minutes and
   * re-verifies each one against Paystack. If Paystack confirms payment was
   * successful, the order is fulfilled as if the webhook arrived normally.
   *
   * This handles the failure case where a webhook was lost (network blip,
   * deploy restart, or Paystack retry window exceeded).
   *
   * PRD non-negotiable: "Scheduled reconciliation job re-verifies any order
   * stuck in pending_payment for more than 10 minutes."
   */
  async reconcileStuckOrders() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stuckOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        createdAt: { lte: tenMinutesAgo },
      },
      select: { id: true, orderNumber: true, createdAt: true },
    });

    if (stuckOrders.length === 0) {
      this.logger.log('Reconciliation: no stuck orders found.');
      return { checked: 0, fulfilled: 0 };
    }

    this.logger.log(
      `Reconciliation: found ${stuckOrders.length} stuck order(s). Re-verifying...`,
    );

    let fulfilled = 0;
    const errors: string[] = [];

    for (const order of stuckOrders) {
      try {
        await this.verifyTransaction(order.orderNumber);
        // Check if it's now paid — verifyTransaction fulfills if Paystack says success
        const refreshed = await this.prisma.order.findUnique({
          where: { id: order.id },
          select: { status: true },
        });
        if (refreshed?.status === OrderStatus.PAID) {
          fulfilled++;
          this.logger.log(
            `Reconciliation: fulfilled order ${order.orderNumber}`,
          );
        } else {
          this.logger.log(
            `Reconciliation: order ${order.orderNumber} still pending after re-verify (payment not confirmed by Paystack)`,
          );
        }
      } catch (err: any) {
        const msg = `Reconciliation error for ${order.orderNumber}: ${err.message}`;
        this.logger.error(msg);
        errors.push(msg);
      }
    }

    return {
      checked: stuckOrders.length,
      fulfilled,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private getPaystackSecret(): string | undefined {
    const secret = process.env.PAYSTACK_SECRET_KEY?.replace(
      /^["']|["']$/g,
      '',
    ).trim();
    if (secret) return secret;

    const mockEnabled =
      process.env.NODE_ENV !== 'production' &&
      process.env.PAYMENTS_MOCK_MODE === 'true';
    if (mockEnabled) return undefined;

    throw new ServiceUnavailableException(
      'Payment processing is not configured',
    );
  }

  private assertPaymentMatchesOrder(
    payment: { reference?: string; amount?: number; currency?: string },
    order: { orderNumber: string; total: number },
  ): void {
    const matches =
      payment.reference === order.orderNumber &&
      payment.amount === order.total &&
      payment.currency === 'NGN';
    if (!matches) {
      this.logger.error(
        `Rejected mismatched payment confirmation for order ${order.orderNumber}`,
      );
      throw new BadRequestException(
        'Payment reference, amount, or currency does not match the order',
      );
    }
  }
}
