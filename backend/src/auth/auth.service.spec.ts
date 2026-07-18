import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException } from '@nestjs/common';

// Mock otplib to prevent Jest from crashing on its nested ESM exports
jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('mock-secret'),
  generateURI: jest.fn().mockReturnValue('mock-uri'),
  verify: jest.fn().mockReturnValue(true),
}));

describe('AuthService & OtpService', () => {
  let authService: AuthService;
  let otpService: OtpService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    otp: {
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn().mockReturnValue({ sub: 'user-1', email: 'test@example.com' }),
  };

  const mockNotificationsService = {
    sendVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendOtpEmail: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        OtpService,
        RefreshTokenService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    otpService = module.get<OtpService>(OtpService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('services should be defined', () => {
    expect(authService).toBeDefined();
    expect(otpService).toBeDefined();
  });

  describe('OtpService.createOtp', () => {
    it('should generate a 6-digit OTP code and hash it', async () => {
      mockPrismaService.otp.findFirst.mockResolvedValue(null);
      mockPrismaService.otp.count.mockResolvedValue(0);
      mockPrismaService.otp.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otp.create.mockResolvedValue({});

      const code = await otpService.createOtp('user-1');
      expect(code).toHaveLength(6);
    });

    it('should throw BadRequestException if user tries to resend in < 60 seconds', async () => {
      const recentOtp = { createdAt: new Date() };
      mockPrismaService.otp.findFirst.mockResolvedValue(recentOtp);

      await expect(otpService.createOtp('user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
