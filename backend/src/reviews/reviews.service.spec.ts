import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let prisma: PrismaService;

  const mockPrismaService: any = {
    product: {
      findUnique: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
    },
    review: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    reviewPhoto: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: any): any => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createReview', () => {
    it('should throw NotFoundException if product is missing', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(
        service.createReview('u-1', 'p-wrong', {
          rating: 5,
          body: 'Perfect bundles',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if customer has no verified purchase history', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrismaService.order.findFirst.mockResolvedValue(null); // No verified orders found

      await expect(
        service.createReview('u-1', 'p-1', {
          rating: 5,
          body: 'Perfect bundles',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on duplicate reviews for the same order', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'o-1' });
      mockPrismaService.review.findFirst.mockResolvedValue({ id: 'r-exist' }); // Review already exists

      await expect(
        service.createReview('u-1', 'p-1', {
          rating: 5,
          body: 'Perfect bundles',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully post review and append photo links inside transactions', async () => {
      const mockReview = {
        id: 'r-new',
        rating: 5,
        body: 'Perfect bundles',
        verifiedPurchase: true,
      };
      mockPrismaService.product.findUnique.mockResolvedValue({ id: 'p-1' });
      mockPrismaService.order.findFirst.mockResolvedValue({ id: 'o-1' });
      mockPrismaService.review.findFirst.mockResolvedValue(null);
      mockPrismaService.review.create.mockResolvedValue(mockReview);
      mockPrismaService.review.findUnique.mockResolvedValue({
        ...mockReview,
        photos: [{ url: 'http://img1' }],
      });

      const result = await service.createReview('u-1', 'p-1', {
        rating: 5,
        body: 'Perfect bundles',
        photos: ['http://img1'],
      });

      expect(result!.id).toBe('r-new');
      expect(mockPrismaService.reviewPhoto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { reviewId: 'r-new', url: 'http://img1' },
        }),
      );
    });
  });

  describe('getProductReviews', () => {
    it('should fetch all reviews matching product', async () => {
      const mockReviews = [{ id: 'r-1', rating: 4, body: 'Good hair' }];
      mockPrismaService.review.findMany.mockResolvedValue(mockReviews);

      const result = await service.getProductReviews('p-1');
      expect(result).toEqual(mockReviews);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { productId: 'p-1' } }),
      );
    });
  });
});
