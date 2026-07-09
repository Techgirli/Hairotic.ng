import { Injectable, BadRequestException, UnauthorizedException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async initializeTransaction(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is already paid or cancelled');
    }

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      this.logger.warn('PAYSTACK_SECRET_KEY is not defined. Falling back to local development mock checkout redirect.');
      
      // Local development mock mode: return success callback instantly
      return {
        authorization_url: `http://localhost:3000/checkout/success?orderNumber=${order.orderNumber}`,
        reference: order.orderNumber,
        isMock: true,
      };
    }

    try {
      const email = order.shippingEmail || order.customer?.email || 'guest@hairotic.ng';
      
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: order.total, // already in kobo
          reference: order.orderNumber,
          callback_url: `http://localhost:3000/checkout/success?orderNumber=${order.orderNumber}`,
        }),
      });

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
      this.logger.error(`Failed to initialize Paystack transaction: ${err.message}`);
      throw new BadRequestException(`Paystack initialization failed: ${err.message}`);
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

    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    // Handle mock verification for local development
    if (!paystackSecret) {
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        await this.fulfillOrder(order.id, reference);
      }
      return { status: 'success', reference, isMock: true };
    }

    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Verification check failed');
      }

      if (result.data.status === 'success' && order.status === OrderStatus.PENDING_PAYMENT) {
        await this.fulfillOrder(order.id, reference);
      }

      return result.data;
    } catch (err: any) {
      this.logger.error(`Failed to verify transaction ${reference}: ${err.message}`);
      throw new BadRequestException(`Verification check failed: ${err.message}`);
    }
  }

  async handleWebhook(signature: string, rawBody: string) {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      this.logger.warn('Webhook received but PAYSTACK_SECRET_KEY is missing. Skipping verification check.');
      return { status: 'ignored' };
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    if (hash !== signature) {
      throw new UnauthorizedException('Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    
    if (payload.event === 'charge.success') {
      const reference = payload.data.reference;
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: reference },
      });

      if (order && order.status === OrderStatus.PENDING_PAYMENT) {
        await this.fulfillOrder(order.id, reference);
        this.logger.log(`Webhook successfully fulfilled order reference: ${reference}`);
      }
    }

    return { status: 'success' };
  }

  private async fulfillOrder(orderId: string, reference: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update Order status to PAID
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
        },
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

      // 4. Trigger Notifications asynchronously
      this.notificationsService.sendOrderConfirmationEmail(updatedOrder).catch((e) =>
        this.logger.error(`Async invoice email dispatch failed: ${e.message}`)
      );

      this.notificationsService.sendWhatsAppNotification(
        updatedOrder.shippingPhone || '',
        `Hi ${updatedOrder.shippingName}! Your payment for order ${updatedOrder.orderNumber} of amount ₦${(updatedOrder.total / 100).toLocaleString()} has been verified successfully. We are preparing it for delivery!`
      ).catch((e) =>
        this.logger.error(`Async WhatsApp notification dispatch failed: ${e.message}`)
      );

      return updatedOrder;
    });
  }
}
