import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';
import { User, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) { }

  async register(email: string, phone: string, password: string) {
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

    // Generate a one-time email verification token (UUID — unguessable)
    const verificationToken = randomUUID();

    const user = await (this.prisma.user as any).create({
      data: {
        email,
        phone,
        passwordHash,
        role: Role.CUSTOMER,
        emailVerified: false,
        verificationToken,
      },
    });

    // Send verification email asynchronously — don't block registration
    this.notificationsService
      .sendVerificationEmail(email, verificationToken)
      .catch(() => { }); // Errors are logged inside the service

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
        verificationToken: null, // Consume the token — one-time use
      },
    });

    return { success: true, message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(email: string) {
    const user = await (this.prisma.user as any).findUnique({ where: { email } });

    if (!user) {
      // Return success anyway to prevent email enumeration
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
      .catch(() => { });

    return { success: true, message: 'If that email exists, a verification link has been sent.' };
  }

  async requestPasswordReset(email: string) {
    // Always return the same message to prevent email enumeration
    const genericResponse = {
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return genericResponse;

    const resetToken = randomUUID();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    this.notificationsService
      .sendPasswordResetEmail(email, resetToken)
      .catch(() => { });

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
        resetTokenExpiry: { gt: new Date() }, // Must not be expired
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
        resetToken: null,       // Consume the token — one-time use
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

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Customers must verify their email before they can log in
    const isCustomer = user.role === Role.CUSTOMER;
    const userAny = user as any;
    if (isCustomer && !userAny.emailVerified) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        error: 'EMAIL_NOT_VERIFIED',
      });
    }

    // ADMIN/STAFF — mandatory MFA
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

    // Customers proceed without MFA
    const tokens = this.generateTokens(user, false);
    return {
      mfaRequired: false,
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  generateTokens(user: User, mfaVerified: boolean) {
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
      expiresIn: '7d',
    });

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

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const secret = generateSecret();
    const otpauthUrl = generateURI({ secret, label: user.email, issuer: 'Hairotic.ng' });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store the pending secret temporarily on the user row.
    // It becomes the "live" secret only after verifyMfa succeeds.
    // TODO: Remove cast after `npx prisma generate` runs against the migrated DB
    await (this.prisma.user as any).update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    return { secret, qrCodeDataUrl };
  }

  async verifyMfa(userId: string, code: string, isSetupFlow: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    // TODO: Remove cast after `npx prisma generate` runs against the migrated DB
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

    return this.generateTokens(user, true);
  }

  async loginWithGoogle(email: string, name?: string) {
    if (!email) {
      throw new BadRequestException('Email is required for Google login');
    }

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Register new user via Google
      let phone = '';
      let phoneExists = true;
      while (phoneExists) {
        const rand = Math.floor(10000000 + Math.random() * 90000000); // 8 digits
        phone = `+234803${rand}`;
        const existingPhone = await this.prisma.user.findUnique({ where: { phone } });
        if (!existingPhone) {
          phoneExists = false;
        }
      }

      // Generate a random password hash
      const randomPassword = randomUUID();
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await (this.prisma.user as any).create({
        data: {
          email,
          phone,
          passwordHash,
          role: Role.CUSTOMER,
          emailVerified: true, // Google accounts are pre-verified
        },
      });
    } else {
      // User exists, make sure email is verified
      if (!(user as any).emailVerified) {
        user = await (this.prisma.user as any).update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }
    }

    const tokens = this.generateTokens(user!, false);
    return {
      success: true,
      ...tokens,
      user: this.sanitizeUser(user!),
    };
  }

  private sanitizeUser(user: User) {
    const sanitized = { ...user };
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).mfaSecret;         // Never expose TOTP secret
    delete (sanitized as any).verificationToken; // Never expose auth tokens
    delete (sanitized as any).resetToken;        // Never expose auth tokens
    delete (sanitized as any).resetTokenExpiry;
    return sanitized;
  }
}
