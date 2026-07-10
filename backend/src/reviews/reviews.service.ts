import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(
    userId: string,
    productId: string,
    data: { rating: number; body: string; photos?: string[] }
  ) {
    const { rating, body, photos } = data;

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    if (!body || body.trim().length < 5) {
      throw new BadRequestException('Review body must be at least 5 characters long');
    }

    // 1. Verify the product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // 2. Verified purchase enforcement: Check for paid/fulfilled orders containing this product
    const orders = await this.prisma.order.findFirst({
      where: {
        customerId: userId,
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
        items: {
          some: {
            variant: {
              productId: productId,
            },
          },
        },
      },
    });

    if (!orders) {
      throw new BadRequestException('Only verified purchasers can submit reviews for this product');
    }

    // 3. Prevent duplicate reviews for the same product by the same user
    const existingReview = await this.prisma.review.findFirst({
      where: {
        productId,
        customerId: userId,
        orderId: orders.id,
      },
    });

    if (existingReview) {
      throw new BadRequestException('You have already submitted a review for this purchase');
    }

    // 4. Create review inside transaction
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          productId,
          customerId: userId,
          orderId: orders.id,
          rating,
          body,
          verifiedPurchase: true,
        },
      });

      if (photos && Array.isArray(photos)) {
        for (const photoUrl of photos) {
          await tx.reviewPhoto.create({
            data: {
              reviewId: review.id,
              url: photoUrl,
            },
          });
        }
      }

      return tx.review.findUnique({
        where: { id: review.id },
        include: { photos: true },
      });
    });
  }

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        photos: true,
        customer: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
