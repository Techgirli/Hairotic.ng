import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderStatus } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;
  let payments: PaymentsService;

  const mockPrismaService: any = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    inventory: {
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    productImage: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    customerNote: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    orderStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: (prisma: any) => any): any => callback(mockPrismaService)),
  };

  const mockPaymentsService = {
    refundTransaction: jest.fn(),
  };

  const mockNotificationsService = {
    sendOrderStatusUpdateNotification: jest
      .fn()
      .mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: PaymentsService, useValue: mockPaymentsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    payments = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateOrderStatus', () => {
    it('should update status and trigger notification', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'HR-0001',
        status: 'PAID',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'PROCESSING',
      });

      const result = await service.updateOrderStatus(
        'order-1',
        OrderStatus.PROCESSING,
        'admin-1',
      );

      expect(result.status).toBe(OrderStatus.PROCESSING);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.order.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'PROCESSING' } }),
      );
      expect(mockPrismaService.orderStatusHistory.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if order does not exist', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOrderStatus(
          'wrong-id',
          OrderStatus.PROCESSING,
          'admin-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adjustInventory', () => {
    it('should adjust inventory level and log audit trails', async () => {
      const mockInventory = {
        id: 'inv-1',
        productVariantId: 'var-1',
        quantity: 10,
        lowStockThreshold: 5,
      };
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrismaService.inventory.update.mockResolvedValue({
        ...mockInventory,
        quantity: 20,
      });

      const result = await service.adjustInventory(
        'var-1',
        20,
        'RESTOCK',
        'admin-1',
      );

      expect(result.quantity).toBe(20);
      expect(mockPrismaService.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { quantity: 20 } }),
      );
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    it('updates variant lengths and replaces their image gallery', async () => {
      const product = {
        id: 'product-1',
        name: 'Curly Wig',
        status: 'DRAFT',
        categoryId: 'category-1',
        variants: [{
          id: 'variant-1',
          attributes: { length: '18', texture: 'curly' },
          images: [{ url: 'https://media.example/old.jpg' }],
        }],
      };
      mockPrismaService.product.findUnique.mockResolvedValue(product);
      mockPrismaService.product.update.mockResolvedValue(product);

      await service.updateProduct('product-1', {
        variants: [{
          id: 'variant-1',
          attributes: { length: '24', texture: 'curly' },
          images: ['https://media.example/new-1.jpg', 'https://media.example/new-2.jpg'],
        }],
      });

      expect(mockPrismaService.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-1' },
        data: { attributes: { length: '24', texture: 'curly' } },
      });
      expect(mockPrismaService.productImage.deleteMany).toHaveBeenCalledWith({
        where: { productVariantId: 'variant-1' },
      });
      expect(mockPrismaService.productImage.createMany).toHaveBeenCalledWith({
        data: [
          { productVariantId: 'variant-1', url: 'https://media.example/new-1.jpg', position: 0 },
          { productVariantId: 'variant-1', url: 'https://media.example/new-2.jpg', position: 1 },
        ],
      });
    });

    it('rejects variants that do not belong to the product', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-1',
        variants: [],
      });

      await expect(service.updateProduct('product-1', {
        variants: [{ id: 'other-product-variant', images: [] }],
      })).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid hair lengths', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        id: 'product-1',
        variants: [{ id: 'variant-1', attributes: {}, images: [] }],
      });

      await expect(service.updateProduct('product-1', {
        variants: [{ id: 'variant-1', attributes: { length: '100' } }],
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('addCustomerNote', () => {
    it('should record administrative profile notes', async () => {
      const mockCustomer = { id: 'cust-1', email: 'customer@example.com' };
      const mockNote = {
        id: 'note-1',
        note: 'VIP shopper',
        customerId: 'cust-1',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customerNote.create.mockResolvedValue(mockNote);

      const result = await service.addCustomerNote(
        'cust-1',
        'VIP shopper',
        'admin-1',
      );

      expect(result).toEqual(mockNote);
      expect(mockPrismaService.customerNote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            customerId: 'cust-1',
            note: 'VIP shopper',
            adminId: 'admin-1',
          },
        }),
      );
    });
  });

  describe('refundOrder', () => {
    it('should delegate refund triggers to PaymentsService', async () => {
      mockPaymentsService.refundTransaction.mockResolvedValue({
        status: 'mock_refunded',
      });

      const result = await service.refundOrder('order-1', 'out of stock');
      expect(result).toEqual({ status: 'mock_refunded' });
      expect(payments.refundTransaction).toHaveBeenCalledWith(
        'order-1',
        'out of stock',
      );
    });
  });
});
