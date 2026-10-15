import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { createHash } from 'crypto';

interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  state: string;
  lga: string;
  street: string;
}

@Injectable()
export class CheckoutService {
  constructor(private prisma: PrismaService) {}

  async createOrder(
    customerId: string | undefined,
    sessionId: string | undefined,
    body: { shippingAddress: ShippingAddress; idempotencyKey: string },
  ) {
    const { shippingAddress } = body;

    // Fetch the active cart. The server derives idempotency from the exact cart
    // snapshot so retries, multiple tabs, and different client keys converge on
    // one order.
    const cart = await this.prisma.cart.findFirst({
      where: customerId ? { customerId } : { sessionId },
      include: {
        items: {
          include: {
            variant: {
              include: {
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty or does not exist');
    }

    const itemSnapshot = cart.items
      .map((item) => `${item.productVariantId}:${item.quantity}`)
      .sort()
      .join('|');
    const idempotencyKey = createHash('sha256')
      .update(`${cart.id}:${cart.updatedAt.toISOString()}:${itemSnapshot}`)
      .digest('hex');

    const existingOrder = await this.findOrderByIdempotencyKey(idempotencyKey);
    if (existingOrder) return existingOrder;

    try {
      return await this.prisma.$transaction(async (tx) => {
      let subtotal = 0;

      // Validate stock levels and compute subtotal.
      // CRITICAL: SELECT ... FOR UPDATE acquires a row-level lock on each
      // inventory row for the duration of this transaction. This prevents two
      // concurrent checkouts from both reading sufficient stock and both
      // decrementing — which would cause an oversell. Do NOT remove this.
      for (const item of cart.items) {
        const [lockedInventory] = await tx.$queryRaw<
          { id: string; quantity: number; low_stock_threshold: number }[]
        >`
          SELECT id, quantity, low_stock_threshold
          FROM inventory
          WHERE product_variant_id = ${item.productVariantId}
          FOR UPDATE
        `;

        if (!lockedInventory) {
          throw new NotFoundException(
            `Inventory not found for variant ${item.variant.sku}`,
          );
        }

        if (lockedInventory.quantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for variant ${item.variant.sku}. Requested: ${item.quantity}, Available: ${lockedInventory.quantity}`,
          );
        }

        // Atomically decrement stock — safe because the FOR UPDATE lock
        // ensures no other transaction has modified this row since we read it.
        await tx.inventory.update({
          where: { id: lockedInventory.id },
          data: { quantity: lockedInventory.quantity - item.quantity },
        });

        subtotal += item.variant.price * item.quantity;
      }

      // Calculate delivery fee
      // Free delivery within Lagos above 250,000 NGN (25,000,000 kobo)
      // Otherwise 5,000 NGN (500,000 kobo) flat fee
      const isLagosFree =
        shippingAddress.state.toLowerCase() === 'lagos' && subtotal >= 25000000;
      const deliveryFee = isLagosFree ? 0 : 500000;
      const total = subtotal + deliveryFee;

      // Generate readable order reference code
      const orderRef = `HR-${Date.now().toString().slice(-6)}-${Math.floor(
        1000 + Math.random() * 9000,
      )}`;

      // Create Order
      const order = await tx.order.create({
        data: {
          orderNumber: orderRef,
          customerId: customerId || null,
          status: OrderStatus.PENDING_PAYMENT,
          subtotal,
          deliveryFee,
          total,
          idempotencyKey,
          shippingName: shippingAddress.name,
          shippingEmail: shippingAddress.email,
          shippingPhone: shippingAddress.phone,
          shippingState: shippingAddress.state,
          shippingLga: shippingAddress.lga,
          shippingStreet: shippingAddress.street,
          checkoutSessionId: customerId ? null : sessionId,
        },
      });

      // Create OrderItems
      for (const item of cart.items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.variant.price,
          },
        });
      }

      // Record Order History
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.PENDING_PAYMENT,
          note: 'Order placed, awaiting checkout payment confirmation.',
          changedBy: customerId || 'GUEST',
        },
      });

      // Clear the Shopping Cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
      await tx.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date() },
      });

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: true,
                  images: { orderBy: { position: 'asc' }, take: 1 },
                },
              },
            },
          },
        },
      });
      });
    } catch (error: any) {
      // A concurrent request can reach order.create before the first transaction
      // commits. The unique key is the final arbiter; return the winner rather
      // than surfacing an error or creating a second order.
      if (error?.code === 'P2002') {
        const winner = await this.findOrderByIdempotencyKey(idempotencyKey);
        if (winner) return winner;
      }
      throw error;
    }
  }

  private findOrderByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.order.findUnique({
      where: { idempotencyKey },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: true,
                images: { orderBy: { position: 'asc' as const }, take: 1 },
              },
            },
          },
        },
      },
    });
  }
}
