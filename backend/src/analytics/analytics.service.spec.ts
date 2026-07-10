import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    analyticsEvent: {
      create: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logEvent', () => {
    it('should successfully save client action logs', async () => {
      const mockEvent = { id: 'evt-1', name: 'view_product', properties: {} };
      mockPrismaService.analyticsEvent.create.mockResolvedValue(mockEvent);

      const result = await service.logEvent('view_product', {}, 'u-1', 's-1');
      expect(result).toEqual(mockEvent);
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            name: 'view_product',
            properties: {},
            userId: 'u-1',
            sessionId: 's-1',
          },
        }),
      );
    });
  });

  describe('getSummaryStats', () => {
    it('should calculate revenue, unique sessions, and AOV correctly', async () => {
      // Mock order sum and count
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { total: 1000000 }, // ₦10,000
        _count: { id: 2 },
      });
      // Mock grouping for unique sessions count
      mockPrismaService.analyticsEvent.groupBy.mockResolvedValueOnce([
        { sessionId: 's-1' },
        { sessionId: 's-2' },
      ]); // total sessions
      mockPrismaService.analyticsEvent.groupBy.mockResolvedValueOnce([
        { sessionId: 's-1' },
      ]); // cart adds sessions
      mockPrismaService.analyticsEvent.findMany.mockResolvedValue([
        { properties: { productId: 'p-1' } },
      ]);
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          id: 'p-1',
          name: 'Straight Bundles',
          variants: [{ orderItems: [{ quantity: 3 }] }],
        },
      ]);

      const result = await service.getSummaryStats();

      expect(result.totalRevenue).toBe(1000000);
      expect(result.totalOrders).toBe(2);
      expect(result.aov).toBe(500000); // ₦5,000
      expect(result.totalSessions).toBe(2);
      expect(result.cartAddRatio).toBe(50); // 1 / 2 * 100
      expect(result.popularProducts[0].name).toBe('Straight Bundles');
      expect(result.popularProducts[0].views).toBe(1);
      expect(result.popularProducts[0].unitsSold).toBe(3);
    });
  });

  describe('getFunnelMetrics', () => {
    it('should compute percentages along funnel steps', async () => {
      mockPrismaService.analyticsEvent.groupBy
        .mockResolvedValueOnce([{ sessionId: 's-1' }, { sessionId: 's-2' }]) // view_product sessions
        .mockResolvedValueOnce([{ sessionId: 's-1' }]) // add_to_cart sessions
        .mockResolvedValueOnce([{ sessionId: 's-1' }]); // begin_checkout sessions

      mockPrismaService.order.count.mockResolvedValue(1); // paid orders

      const result = await service.getFunnelMetrics();

      expect(result.steps[0].name).toBe('Product Views');
      expect(result.steps[0].count).toBe(2);
      expect(result.steps[1].name).toBe('Cart Adds');
      expect(result.steps[1].count).toBe(1);
      expect(result.steps[1].percentage).toBe(50); // 1 / 2 * 100
      expect(result.steps[3].name).toBe('Purchases');
      expect(result.steps[3].count).toBe(1);
      expect(result.steps[3].percentage).toBe(100); // 1 / 1 * 100
    });
  });
});
