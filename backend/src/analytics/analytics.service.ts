import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async logEvent(name: string, properties: any, userId?: string, sessionId?: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        name,
        properties: properties ?? {},
        userId: userId || null,
        sessionId: sessionId || null,
      },
    });
  }

  async getSummaryStats() {
    // 1. Calculate Revenue and Order Count
    const paidStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];

    const orderAggregates = await this.prisma.order.aggregate({
      where: {
        status: { in: paidStatuses },
      },
      _sum: {
        total: true,
      },
      _count: {
        id: true,
      },
    });

    const totalRevenue = orderAggregates._sum.total ?? 0;
    const totalOrders = orderAggregates._count.id ?? 0;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 2. Count Unique Sessions
    const sessionsCount = await this.prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        sessionId: { not: null },
      },
    });
    const totalSessions = sessionsCount.length;

    // 3. Add-to-cart conversion
    const cartAddSessions = await this.prisma.analyticsEvent.groupBy({
      by: ['sessionId'],
      where: {
        name: 'add_to_cart',
        sessionId: { not: null },
      },
    });
    const cartAddSessionsCount = cartAddSessions.length;
    const cartAddRatio = totalSessions > 0 ? (cartAddSessionsCount / totalSessions) * 100 : 0;

    // 4. Fetch Popular Products (views & buys)
    const productViews = await this.prisma.analyticsEvent.findMany({
      where: { name: 'view_product' },
    });

    // Aggregate Views in memory
    const viewsMap: Record<string, number> = {};
    productViews.forEach((evt: any) => {
      const pId = evt.properties?.productId;
      if (pId) {
        viewsMap[pId] = (viewsMap[pId] || 0) + 1;
      }
    });

    const popularProductsRaw = await this.prisma.product.findMany({
      take: 5,
      include: {
        variants: {
          include: {
            orderItems: {
              where: {
                order: { status: { in: paidStatuses } },
              },
            },
          },
        },
      },
    });

    const popularProducts = popularProductsRaw.map((p) => {
      const views = viewsMap[p.id] ?? 0;
      let unitsSold = 0;
      p.variants.forEach((v) => {
        v.orderItems.forEach((oi) => {
          unitsSold += oi.quantity;
        });
      });

      return {
        id: p.id,
        name: p.name,
        views,
        unitsSold,
      };
    }).sort((a, b) => b.views - a.views);

    return {
      totalRevenue,
      totalOrders,
      aov,
      totalSessions,
      cartAddRatio: parseFloat(cartAddRatio.toFixed(1)),
      popularProducts,
    };
  }

  async getFunnelMetrics() {
    // Unique session counts per step
    const getStepSessionsCount = async (eventName: string) => {
      const sessions = await this.prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
          name: eventName,
          sessionId: { not: null },
        },
      });
      return sessions.length;
    };

    const viewProductCount = await getStepSessionsCount('view_product');
    const addToCartCount = await getStepSessionsCount('add_to_cart');
    const beginCheckoutCount = await getStepSessionsCount('begin_checkout');
    
    // Purchases are computed from actual paid orders
    const paidStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    const purchaseCount = await this.prisma.order.count({
      where: { status: { in: paidStatuses } },
    });

    const steps = [
      { name: 'Product Views', count: viewProductCount, percentage: 100 },
      {
        name: 'Cart Adds',
        count: addToCartCount,
        percentage: viewProductCount > 0 ? Math.round((addToCartCount / viewProductCount) * 100) : 0,
      },
      {
        name: 'Checkout Starts',
        count: beginCheckoutCount,
        percentage: addToCartCount > 0 ? Math.round((beginCheckoutCount / addToCartCount) * 100) : 0,
      },
      {
        name: 'Purchases',
        count: purchaseCount,
        percentage: beginCheckoutCount > 0 ? Math.round((purchaseCount / beginCheckoutCount) * 100) : 0,
      },
    ];

    return { steps };
  }

  async getExportData() {
    return this.prisma.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });
  }
}
