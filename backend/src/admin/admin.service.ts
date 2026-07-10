import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private paymentsService: PaymentsService,
    private notificationsService: NotificationsService,
  ) {}

  async getDashboardStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 1. Sales today (completed payments)
    const salesTodayAggregate = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
        createdAt: { gte: startOfToday, lte: endOfToday },
      },
    });

    // 2. Total revenue (completed payments all time)
    const totalRevenueAggregate = await this.prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: {
          in: [
            OrderStatus.PAID,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED,
          ],
        },
      },
    });

    // 3. Count of pending orders
    const pendingOrdersCount = await this.prisma.order.count({
      where: { status: OrderStatus.PENDING_PAYMENT },
    });

    // 4. Low stock variants count
    const lowStockVariantsCount = await this.prisma.inventory.count({
      where: {
        quantity: { lte: this.prisma.inventory.fields.lowStockThreshold },
      },
    });

    // 5. Recent orders (past 5)
    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    return {
      salesToday: salesTodayAggregate._sum.total || 0,
      totalRevenue: totalRevenueAggregate._sum.total || 0,
      pendingOrdersCount,
      lowStockVariantsCount,
      recentOrders,
    };
  }

  async getOrders(status?: OrderStatus, search?: string) {
    const whereClause: any = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { shippingName: { contains: search, mode: 'insensitive' } },
        { shippingEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.order.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    changedBy: string,
    note?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Update order status in a transaction
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id: orderId },
        data: { status },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status,
          note: note || `Order status updated to ${status} by admin/staff.`,
          changedBy,
        },
      });

      return ord;
    });

    // Send customer updates asynchronously
    if (
      status === OrderStatus.PROCESSING ||
      status === OrderStatus.SHIPPED ||
      status === OrderStatus.DELIVERED ||
      status === OrderStatus.CANCELLED
    ) {
      this.notificationsService
        .sendOrderStatusUpdateNotification(updatedOrder, status, note)
        .catch((e) =>
          console.error(
            `Async status update notification dispatch failed: ${e.message}`,
          ),
        );
    }

    return updatedOrder;
  }

  async refundOrder(orderId: string, reason: string) {
    return this.paymentsService.refundTransaction(orderId, reason);
  }

  async getInventory() {
    return this.prisma.productVariant.findMany({
      include: {
        product: true,
        inventory: true,
      },
      orderBy: { sku: 'asc' },
    });
  }

  async adjustInventory(
    variantId: string,
    quantity: number,
    reason: string,
    actorId: string,
  ) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productVariantId: variantId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found for variant');
    }

    const previousQuantity = inventory.quantity;

    const updatedInventory = await this.prisma.$transaction(async (tx) => {
      const inv = await tx.inventory.update({
        where: { productVariantId: variantId },
        data: { quantity },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'INVENTORY_ADJUST',
          entity: 'inventory',
          entityId: inv.id,
          before: { quantity: previousQuantity },
          after: { quantity, reason },
        },
      });

      return inv;
    });

    return updatedInventory;
  }

  async getCustomers() {
    // Return all customer users + their order aggregates
    const customers = await this.prisma.user.findMany({
      where: { role: Role.CUSTOMER },
      include: {
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
              ],
            },
          },
        },
      },
    });

    return customers.map((c) => {
      const orderCount = c.orders.length;
      const ltv = c.orders.reduce((sum, order) => sum + order.total, 0);
      const sanitized = { ...c };
      delete (sanitized as any).passwordHash;
      return {
        ...sanitized,
        orderCount,
        ltv,
      };
    });
  }

  async getCustomerDetails(customerId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
      include: {
        addresses: true,
        orders: {
          include: {
            items: {
              include: {
                variant: {
                  include: { product: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        customerNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            admin: {
              select: { email: true },
            },
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const sanitized = { ...customer };
    delete (sanitized as any).passwordHash;

    // Calculate LTV
    const paidStatuses = [
      OrderStatus.PAID,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ] as OrderStatus[];
    const completedOrders = customer.orders.filter((o) =>
      paidStatuses.includes(o.status),
    );
    const ltv = completedOrders.reduce((sum, order) => sum + order.total, 0);

    return {
      ...sanitized,
      ltv,
      orderCount: customer.orders.length,
    };
  }

  async addCustomerNote(customerId: string, note: string, adminId: string) {
    const customer = await this.prisma.user.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return this.prisma.customerNote.create({
      data: {
        customerId,
        note,
        adminId,
      },
      include: {
        admin: {
          select: { email: true },
        },
      },
    });
  }

  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        collection: true,
        variants: {
          include: {
            images: { orderBy: { position: 'asc' } },
            inventory: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProduct(body: any) {
    const { name, description, categoryId, collectionId, status, variants } =
      body;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existing = await this.prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException(
        'Product with a similar name/slug already exists',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          slug,
          description,
          categoryId,
          collectionId: collectionId || null,
          status: status || 'DRAFT',
        },
      });

      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku,
              price: Math.round(Number(v.price)),
              compareAtPrice: v.compareAtPrice
                ? Math.round(Number(v.compareAtPrice))
                : null,
              attributes: v.attributes || {},
            },
          });

          await tx.inventory.create({
            data: {
              productVariantId: variant.id,
              quantity: v.quantity !== undefined ? Number(v.quantity) : 0,
              lowStockThreshold:
                v.lowStockThreshold !== undefined
                  ? Number(v.lowStockThreshold)
                  : 5,
            },
          });

          if (v.images && Array.isArray(v.images)) {
            for (let idx = 0; idx < v.images.length; idx++) {
              await tx.productImage.create({
                data: {
                  productVariantId: variant.id,
                  url: v.images[idx],
                  position: idx,
                },
              });
            }
          }
        }
      }

      return product;
    });
  }

  async updateProduct(id: string, body: any) {
    const {
      name,
      description,
      categoryId,
      collectionId,
      status,
      price,
      compareAtPrice,
    } = body;

    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const data: any = {};
    if (name) {
      data.name = name;
      data.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (description !== undefined) data.description = description;
    if (categoryId) data.categoryId = categoryId;
    if (collectionId !== undefined) data.collectionId = collectionId || null;
    if (status) data.status = status;

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data,
      });

      // Simple variant price updates if specified
      if (price !== undefined && product.variants.length > 0) {
        for (const variant of product.variants) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              price: Math.round(Number(price)),
              compareAtPrice: compareAtPrice
                ? Math.round(Number(compareAtPrice))
                : null,
            },
          });
        }
      }

      return updated;
    });
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
