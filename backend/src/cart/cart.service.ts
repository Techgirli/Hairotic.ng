import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateCart(customerId?: string, sessionId?: string) {
    if (!customerId && !sessionId) {
      throw new BadRequestException('Either customerId or sessionId must be provided');
    }

    let cart = null;

    if (customerId) {
      cart = await this.prisma.cart.findUnique({
        where: { customerId },
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

      if (!cart && sessionId) {
        // Check if there is a guest cart under this sessionId
        const guestCart = await this.prisma.cart.findUnique({
          where: { sessionId },
        });

        if (guestCart) {
          // Upgrade guest cart to customer cart
          cart = await this.prisma.cart.update({
            where: { id: guestCart.id },
            data: { customerId, sessionId: null },
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
        }
      }
    } else if (sessionId) {
      cart = await this.prisma.cart.findUnique({
        where: { sessionId },
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
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          customerId: customerId || null,
          sessionId: customerId ? null : (sessionId || null),
        },
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
    }

    return cart;
  }

  async addItem(cartId: string, variantId: string, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero');
    }

    // Verify stock availability
    const inventory = await this.prisma.inventory.findUnique({
      where: { productVariantId: variantId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found for this variant');
    }

    // Check if item already in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productVariantId: {
          cartId,
          productVariantId: variantId,
        },
      },
    });

    const targetQty = existingItem ? existingItem.quantity + quantity : quantity;

    if (inventory.quantity < targetQty) {
      throw new BadRequestException(`Insufficient stock. Only ${inventory.quantity} units available.`);
    }

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: targetQty },
      });
    } else {
      return this.prisma.cartItem.create({
        data: {
          cartId,
          productVariantId: variantId,
          quantity,
        },
      });
    }
  }

  async updateQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    // Check stock
    const inventory = await this.prisma.inventory.findUnique({
      where: { productVariantId: item.productVariantId },
    });

    if (!inventory || inventory.quantity < quantity) {
      throw new BadRequestException(`Insufficient stock. Only ${inventory?.quantity || 0} units available.`);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  async removeItem(itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async mergeCarts(sessionId: string, customerId: string) {
    const guestCart = await this.prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(customerId);
    }

    const customerCart = await this.getOrCreateCart(customerId);

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingCustomerItem = customerCart.items.find(
        (ci) => ci.productVariantId === guestItem.productVariantId
      );

      if (existingCustomerItem) {
        // Merge quantities checking stock limits
        const inventory = await this.prisma.inventory.findUnique({
          where: { productVariantId: guestItem.productVariantId },
        });

        const mergedQty = Math.min(
          existingCustomerItem.quantity + guestItem.quantity,
          inventory?.quantity || 10
        );

        await this.prisma.cartItem.update({
          where: { id: existingCustomerItem.id },
          data: { quantity: mergedQty },
        });
      } else {
        // Re-assign item to customer cart
        await this.prisma.cartItem.create({
          data: {
            cartId: customerCart.id,
            productVariantId: guestItem.productVariantId,
            quantity: guestItem.quantity,
          },
        });
      }
    }

    // Delete guest cart
    await this.prisma.cart.delete({
      where: { id: guestCart.id },
    });

    return this.getOrCreateCart(customerId);
  }
}
