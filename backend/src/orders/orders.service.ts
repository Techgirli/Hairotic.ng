import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async getOrdersForCustomer(userId: string) {
    return this.prisma.order.findMany({
      where: { customerId: userId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async trackOrder(orderNumber: string, contact: { email?: string; phone?: string }) {
    const { email, phone } = contact;

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
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
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Guess-prevention: Ensure contact details match email or phone
    const emailMatches = email && order.shippingEmail?.toLowerCase() === email.toLowerCase();
    const phoneMatches = phone && order.shippingPhone === phone;

    if (!emailMatches && !phoneMatches) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getOrderDetails(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
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
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.customerId !== userId) {
      throw new ForbiddenException('You do not have permission to view this order');
    }

    return order;
  }
}
