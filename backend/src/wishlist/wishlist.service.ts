import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async getWishlist(customerId: string) {
    return this.prisma.wishlist.findMany({
      where: { customerId },
      include: {
        variant: {
          include: {
            product: true,
            images: { orderBy: { position: 'asc' }, take: 1 },
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWishlist(customerId: string, productVariantId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        customerId_productVariantId: {
          customerId,
          productVariantId,
        },
      },
    });

    if (existing) {
      return existing; // Already wishlisted, return gracefully
    }

    return this.prisma.wishlist.create({
      data: {
        customerId,
        productVariantId,
      },
    });
  }

  async removeFromWishlist(customerId: string, productVariantId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        customerId_productVariantId: {
          customerId,
          productVariantId,
        },
      },
    });

    if (!existing) {
      return { success: true }; // Already removed, return gracefully
    }

    await this.prisma.wishlist.delete({
      where: {
        customerId_productVariantId: {
          customerId,
          productVariantId,
        },
      },
    });

    return { success: true };
  }
}
