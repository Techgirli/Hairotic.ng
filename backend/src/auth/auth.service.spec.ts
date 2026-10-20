import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

// Mock otplib to prevent Jest from crashing on its nested ESM exports
jest.mock('otplib', () => ({
  generateSecret: jest.fn().mockReturnValue('mock-secret'),
  generateURI: jest.fn().mockReturnValue('mock-uri'),
  verify: jest.fn().mockReturnValue(true),
}));

describe('AuthService & OtpService', () => {
  let authService: AuthService;
  let otpService: OtpService;
  let refreshTokenService: RefreshTokenService;
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
    jest.clearAllMocks();

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
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
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

      const now = Date.now();
      const code = await otpService.createOtp('user-1');
      expect(code).toHaveLength(6);
      const [{ data }] = mockPrismaService.otp.create.mock.calls[0];
      expect(data.expiresAt.getTime()).toBeGreaterThanOrEqual(now + 30 * 60 * 1000);
      expect(data.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 30 * 60 * 1000);
    });

    it('should throw BadRequestException if user tries to resend in < 60 seconds', async () => {
      const recentOtp = { createdAt: new Date() };
      mockPrismaService.otp.findFirst.mockResolvedValue(recentOtp);

      await expect(otpService.createOtp('user-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('OTP email matching', () => {
    it('looks up the exact normalized email when verifying an OTP', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        otpService.verifyOtp(' FaveCollections1@Gmail.com ', '123456'),
      ).rejects.toThrow('Invalid email or OTP');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'favecollections1@gmail.com' },
      });
    });

    it('sends a resend code to the exact normalized email account', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'favecollections1@gmail.com',
        name: 'Admin',
        role: Role.CUSTOMER,
      });
      mockPrismaService.otp.findFirst.mockResolvedValue(null);
      mockPrismaService.otp.count.mockResolvedValue(0);
      mockPrismaService.otp.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otp.create.mockResolvedValue({});

      await authService.resendOtp(' FaveCollections1@Gmail.com ');

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'favecollections1@gmail.com' },
      });
      expect(mockNotificationsService.sendOtpEmail).toHaveBeenCalledWith(
        'favecollections1@gmail.com',
        'Admin',
        expect.any(String),
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('does not send public login OTPs to admin accounts', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@example.com',
        role: Role.ADMIN,
      });

      const result = await authService.resendOtp('admin@example.com');

      expect(result.success).toBe(true);
      expect(mockNotificationsService.sendOtpEmail).not.toHaveBeenCalled();
      expect(mockPrismaService.otp.create).not.toHaveBeenCalled();
    });

    it('does not create or email an OTP when the email is not registered', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await authService.resendOtp('missing@example.com');

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockNotificationsService.sendOtpEmail).not.toHaveBeenCalled();
    });

    it('does not allow public OTP verification to authenticate an admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        role: Role.ADMIN,
      });

      await expect(
        otpService.verifyOtp('admin@example.com', '123456'),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.otp.findFirst).not.toHaveBeenCalled();
    });

    describe('Admin email OTP verification', () => {
      it('only verifies an admin OTP for the authenticated user', async () => {
        const verifyOtpForUser = jest
          .spyOn(otpService, 'verifyOtpForUser')
          .mockResolvedValue('admin-1');
        const user = {
          id: 'admin-1',
          email: 'admin@example.com',
          role: Role.ADMIN,
          mfaEnabled: true,
        };
        mockPrismaService.user.findUnique.mockResolvedValue(user);
        jest.spyOn(refreshTokenService, 'createRefreshToken').mockResolvedValue();

        const result = await authService.verifyAdminOtpAndCreateSession(
          'admin-1',
          '123456',
        );

        expect(verifyOtpForUser).toHaveBeenCalledWith('admin-1', '123456');
        expect(result.user).toEqual(user);
      });
    });

    it('returns an error when the OTP email provider rejects delivery', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'favecollections1@gmail.com',
        name: 'Admin',
        role: Role.CUSTOMER,
      });
      mockPrismaService.otp.findFirst.mockResolvedValue(null);
      mockPrismaService.otp.count.mockResolvedValue(0);
      mockPrismaService.otp.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.otp.create.mockResolvedValue({});
      mockNotificationsService.sendOtpEmail.mockResolvedValue({
        success: false,
        error: 'domain is not verified',
      });

      await expect(
        authService.resendOtp('favecollections1@gmail.com'),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('password login account selection', () => {
    it('only looks up the exact normalized email and never creates an admin fallback', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login(' attacker+admin@example.com ', 'irrelevant'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'attacker+admin@example.com' },
      });
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('does not allow customer credentials through the admin login flow', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'customer-1',
        email: 'customer@example.com',
        role: Role.CUSTOMER,
      });

      await expect(
        authService.login('customer@example.com', 'password', true),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
