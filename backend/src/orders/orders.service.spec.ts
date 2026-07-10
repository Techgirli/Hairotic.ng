import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrdersForCustomer', () => {
    it('should return orders for a specific customer', async () => {
      const mockOrders = [{ id: 'order-1', customerId: 'cust-1', total: 5000 }];
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getOrdersForCustomer('cust-1');
      expect(result).toEqual(mockOrders);
      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { customerId: 'cust-1' } }),
      );
    });
  });

  describe('trackOrder', () => {
    it('should successfully track order with correct email verification', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'HR-123456',
        shippingEmail: 'customer@example.com',
        shippingPhone: '+2348012345678',
        status: 'PAID',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.trackOrder('HR-123456', {
        email: 'customer@example.com',
      });
      expect(result).toEqual(mockOrder);
    });

    it('should fail tracking if email/phone does not match', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'HR-123456',
        shippingEmail: 'customer@example.com',
        shippingPhone: '+2348012345678',
      };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.trackOrder('HR-123456', { email: 'wrong@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getOrderDetails', () => {
    it('should retrieve order details if owned by user', async () => {
      const mockOrder = { id: 'order-1', customerId: 'cust-1' };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.getOrderDetails('order-1', 'cust-1');
      expect(result).toEqual(mockOrder);
    });

    it('should throw ForbiddenException if order is not owned by user', async () => {
      const mockOrder = { id: 'order-1', customerId: 'cust-1' };
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.getOrderDetails('order-1', 'cust-other'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
