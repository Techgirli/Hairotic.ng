import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService: any = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    address: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback: any): any => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return profile and omit passwordHash', async () => {
      const mockUser = {
        id: 'u-1',
        email: 'test@example.com',
        passwordHash: 'hashed123',
        addresses: [],
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile('u-1');
      expect(result).toEqual({
        id: 'u-1',
        email: 'test@example.com',
        addresses: [],
      });
      expect(result.passwordHash).toBeUndefined();
    });

    it('should throw NotFoundException if user profile not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('u-wrong')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile and verify email uniques', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null); // No email clashes
      mockPrismaService.user.update.mockResolvedValue({
        id: 'u-1',
        email: 'new@example.com',
      });

      const result = await service.updateProfile('u-1', {
        email: 'new@example.com',
      });
      expect(result.email).toBe('new@example.com');
    });

    it('should throw BadRequestException if email is already in use by another profile', async () => {
      const existingUser = { id: 'u-other', email: 'clash@example.com' };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.updateProfile('u-1', { email: 'clash@example.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAddresses', () => {
    it('should return addresses sorted', async () => {
      const mockAddresses = [
        { id: 'a-1', street: 'street 1', isDefault: true },
      ];
      mockPrismaService.address.findMany.mockResolvedValue(mockAddresses);

      const result = await service.getAddresses('u-1');
      expect(result).toEqual(mockAddresses);
    });
  });

  describe('addAddress', () => {
    it('should append new address and toggle default status correctly', async () => {
      mockPrismaService.address.count.mockResolvedValue(1);
      mockPrismaService.address.create.mockResolvedValue({
        id: 'a-new',
        isDefault: true,
      });

      const result = await service.addAddress('u-1', {
        label: 'Work',
        street: '123 Work St',
        state: 'Lagos',
        lga: 'Ikeja',
        phone: '+2348000',
        isDefault: true,
      });

      expect(result.isDefault).toBe(true);
      expect(mockPrismaService.address.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u-1', isDefault: true } }),
      );
    });
  });

  describe('deleteAddress', () => {
    it('should check ownership and delete successfully', async () => {
      const mockAddress = { id: 'a-1', userId: 'u-1', isDefault: true };
      mockPrismaService.address.findUnique.mockResolvedValue(mockAddress);
      mockPrismaService.address.findFirst.mockResolvedValue({
        id: 'a-2',
        userId: 'u-1',
      });

      await service.deleteAddress('u-1', 'a-1');
      expect(mockPrismaService.address.delete).toHaveBeenCalledWith({
        where: { id: 'a-1' },
      });
      expect(mockPrismaService.address.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'a-2' },
          data: { isDefault: true },
        }),
      );
    });
  });
});
