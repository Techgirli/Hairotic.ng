import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OtpService } from './otp.service';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { User, Role } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient = new OAuth2Client((process.env.GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, ''));

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private otpService: OtpService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async register(email: string, phone: string, password: string, name?: string) {
    if (!email || !phone || !password) {
      throw new BadRequestException('Email, phone number, and password are required');
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email address format');
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('Invalid phone number format. Must be 10-15 digits.');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this email or phone number already exists',
      );
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationToken = randomUUID();
    const isDev = process.env.NODE_ENV !== 'production';
    
    const user = await (this.prisma.user as any).create({
      data: {
        email,
        phone,
        name,
        passwordHash,
        role: Role.CUSTOMER,
        emailVerified: isDev,
        verificationToken: isDev ? null : verificationToken,
      },
    });

    this.notificationsService
      .sendVerificationEmail(email, verificationToken)
      .catch(() => {});

    return {
      ...this.sanitizeUser(user),
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await (this.prisma.user as any).findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return { success: true, message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string) {
    const user = await (this.prisma.user as any).findUnique({ where: { email } });

    if (!user) {
      return { success: true, message: 'If that email exists, a verification link has been sent.' };
    }

    if (user.emailVerified) {
      throw new BadRequestException('This email is already verified');
    }

    const verificationToken = randomUUID();
    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: { verificationToken },
    });

    this.notificationsService
      .sendVerificationEmail(email, verificationToken)
      .catch(() => {});

    return { success: true, message: 'If that email exists, a verification link has been sent.' };
  }

  async requestPasswordReset(email: string) {
    const genericResponse = {
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return genericResponse;

    const resetToken = randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    this.notificationsService
      .sendPasswordResetEmail(email, resetToken)
      .catch(() => {});

    return genericResponse;
  }

  async confirmPasswordReset(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Token and new password are required');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const user = await (this.prisma.user as any).findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { success: true, message: 'Password reset successfully. You can now log in.' };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('This account uses Google login. Please sign in with Google.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isCustomer = user.role === Role.CUSTOMER;
    const userAny = user as any;
    if (isCustomer && !userAny.emailVerified && process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        error: 'EMAIL_NOT_VERIFIED',
      });
    }

    const isAdminOrStaff = user.role === Role.ADMIN || user.role === Role.STAFF;
    if (isAdminOrStaff) {
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role, mfaVerified: false },
        { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
      );
      return {
        mfaRequired: true,
        mfaSetup: !user.mfaEnabled,
        tempToken,
        user: this.sanitizeUser(user),
      };
    }

    const tokens = await this.generateSession(user);
    return {
      mfaRequired: false,
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async generateSession(user: User, device?: string, ip?: string, mfaVerified = false) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      mfaVerified,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key',
      expiresIn: '30d',
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.refreshTokenService.createRefreshToken(user.id, refreshToken, expiresAt, device, ip);

    return { accessToken, refreshToken };
  }

  async verifyRefresh(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key',
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException('User not found');
      return { user, mfaVerified: payload.mfaVerified };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refreshSession(oldRefreshToken: string, device?: string, ip?: string) {
    const { user } = await this.verifyRefresh(oldRefreshToken);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key',
      expiresIn: '15m',
    });

    const newRefreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key',
      expiresIn: '30d',
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.refreshTokenService.rotateRefreshToken(
      user.id,
      oldRefreshToken,
      newRefreshToken,
      expiresAt,
      device,
      ip,
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logoutSession(userId: string, refreshToken: string) {
    await this.refreshTokenService.revokeRefreshToken(userId, refreshToken);
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const secret = generateSecret();
    const otpauthUrl = generateURI({ secret, label: user.email, issuer: 'Hairotic.ng' });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    await (this.prisma.user as any).update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCodeDataUrl };
  }

  async verifyMfa(userId: string, code: string, isSetupFlow: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const userWithMfa = user as any;
    if (!userWithMfa.mfaSecret) {
      throw new BadRequestException('MFA configuration missing. Please restart setup.');
    }

    const isValid = await verify({ token: code, secret: userWithMfa.mfaSecret });
    if (!isValid) throw new BadRequestException('Invalid authentication code');

    if (isSetupFlow) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });
    }

    const tokens = await this.generateSession(user, undefined, undefined, true);
    return tokens;
  }

  async loginWithGoogle(idToken: string, deviceId?: string) {
    if (!idToken) {
      throw new BadRequestException('Google ID Token is required');
    }

    let payload: any;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Google ID token did not contain email field');
      }
    } catch (err: any) {
      this.logger.error(`Google token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid Google ID Token');
    }

    const { email, name, picture, sub: googleId } = payload;
    let user = await this.prisma.user.findUnique({ where: { email } });

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      user = await (this.prisma.user as any).create({
        data: {
          email,
          name,
          avatar: picture,
          provider: 'google',
          googleId,
          emailVerified: true,
          role: Role.CUSTOMER,
        },
      });
    } else {
      const updateData: any = { emailVerified: true };
      const userAny = user as any;
      if (!userAny.name && name) updateData.name = name;
      if (!userAny.avatar && picture) updateData.avatar = picture;
      if (userAny.provider === 'local') {
        updateData.provider = 'google';
        updateData.googleId = googleId;
      }
      user = await (this.prisma.user as any).update({
        where: { id: user.id },
        data: updateData,
      });
    }

    const activeUser = user as any;

    // Check device recognition strategy
    let deviceRecognized = false;
    if (deviceId) {
      const recognized = await (this.prisma as any).refreshToken.findFirst({
        where: {
          userId: activeUser.id,
          device: deviceId,
        },
      });
      if (recognized) {
        deviceRecognized = true;
      }
    }

    // Bypass OTP for returning users on a recognized device
    if (!isNewUser && deviceRecognized) {
      this.logger.log(`Bypassing OTP: user ${activeUser.id} logged in from recognized device ${deviceId}`);
      return {
        mfaRequired: false,
        user: this.sanitizeUser(activeUser),
      };
    }

    // Otherwise, generate 6-digit OTP and send verify email
    const otp = await this.otpService.createOtp(activeUser.id);
    const emailResult = await this.notificationsService.sendOtpEmail(activeUser.email, activeUser.name || '', otp);
    
    if (!emailResult.success) {
      this.logger.warn(`Resend failed to deliver OTP: ${emailResult.error || 'Unknown error'}. Fallback code printed to console.`);
      console.log(`\n--- OTP FALLBACK FOR DEV: ${activeUser.email} ---\nOTP CODE: ${otp}\n-----------------------------------\n`);
    }

    return {
      mfaRequired: true,
      email: activeUser.email,
    };
  }

  async verifyOtpAndCreateSession(email: string, otp: string, device?: string, ip?: string) {
    const userId = await this.otpService.verifyOtp(email, otp);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const tokens = await this.generateSession(user, device, ip);
    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const userAny = user as any;
    const otp = await this.otpService.createOtp(userAny.id);
    const emailResult = await this.notificationsService.sendOtpEmail(userAny.email, userAny.name || '', otp);
    if (!emailResult.success) {
      this.logger.warn(`Resend failed to deliver OTP email on resend request: ${emailResult.error || 'Unknown error'}. Fallback code printed to console.`);
      console.log(`\n--- OTP RESEND FALLBACK: ${userAny.email} ---\nOTP CODE: ${otp}\n---------------------------------------\n`);
    }

    return { success: true, message: 'A new 6-digit code has been sent to your email.' };
  }

  private sanitizeUser(user: User) {
    const sanitized = { ...user };
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).mfaSecret;
    delete (sanitized as any).verificationToken;
    delete (sanitized as any).resetToken;
    delete (sanitized as any).resetTokenExpiry;
    return sanitized;
  }
}
