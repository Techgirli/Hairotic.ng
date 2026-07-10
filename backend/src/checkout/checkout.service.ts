import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

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
    const { shippingAddress, idempotencyKey } = body;

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency key is required');
    }

    // 1. Check if order with this idempotency key already exists
    const existingOrder = await this.prisma.order.findUnique({
      where: { idempotencyKey },
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

    if (existingOrder) {
      return existingOrder;
    }

    // 2. Fetch the active cart
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

    // 3. Process checkout transaction
    return this.prisma.$transaction(async (tx) => {
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
  }
}
