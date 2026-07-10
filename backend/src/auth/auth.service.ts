import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { User, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, phone: string, password: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'User with this email or phone number already exists',
      );
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        passwordHash,
        role: Role.CUSTOMER,
      },
    });

    return this.sanitizeUser(user);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is Admin/Staff (MFA is mandatory)
    const isAdminOrStaff = user.role === Role.ADMIN || user.role === Role.STAFF;

    if (isAdminOrStaff) {
      if (!user.mfaEnabled) {
        // MFA setup is required (first-time login)
        const tempToken = this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: false,
          },
          { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
        );
        return {
          mfaRequired: true,
          mfaSetup: true,
          tempToken,
          user: this.sanitizeUser(user),
        };
      } else {
        // MFA challenge required
        const tempToken = this.jwtService.sign(
          {
            sub: user.id,
            email: user.email,
            role: user.role,
            mfaVerified: false,
          },
          { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
        );
        return {
          mfaRequired: true,
          mfaSetup: false,
          tempToken,
          user: this.sanitizeUser(user),
        };
      }
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
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return { user, mfaVerified: payload.mfaVerified };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const secret = generateSecret();
    const otpauthUrl = generateURI({
      secret,
      label: user.email,
      issuer: 'Hairotic.ng',
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Save temporary secret (we will finalize it on verify)
    await this.prisma.customerNote.create({
      data: {
        customerId: userId,
        adminId: userId, // self-reference for system temporary variables
        note: `TEMP_MFA_SECRET:${secret}`,
      },
    });

    return { secret, qrCodeDataUrl };
  }

  async verifyMfa(userId: string, code: string, isSetupFlow: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    let secret = '';

    if (isSetupFlow) {
      // Fetch temporary secret from customer notes
      const tempNote = await this.prisma.customerNote.findFirst({
        where: {
          customerId: userId,
          note: { startsWith: 'TEMP_MFA_SECRET:' },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!tempNote) {
        throw new BadRequestException(
          'MFA setup session expired or not initialized',
        );
      }

      secret = tempNote.note.replace('TEMP_MFA_SECRET:', '');

      // Verify token
      const isValid = await verify({ token: code, secret });
      if (!isValid) {
        throw new BadRequestException('Invalid authentication code');
      }

      // Save secret permanently into user's admin notes or update role security context
      await this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });

      await this.prisma.customerNote.create({
        data: {
          customerId: userId,
          adminId: userId,
          note: `MFA_SECRET:${secret}`,
        },
      });

      // Cleanup temp notes
      await this.prisma.customerNote.deleteMany({
        where: {
          customerId: userId,
          note: { startsWith: 'TEMP_MFA_SECRET:' },
        },
      });
    } else {
      // Verify using active secret
      const activeNote = await this.prisma.customerNote.findFirst({
        where: {
          customerId: userId,
          note: { startsWith: 'MFA_SECRET:' },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!activeNote) {
        throw new BadRequestException(
          'MFA configuration missing. Please reset setup.',
        );
      }

      secret = activeNote.note.replace('MFA_SECRET:', '');
      const isValid = await verify({ token: code, secret });
      if (!isValid) {
        throw new BadRequestException('Invalid authentication code');
      }
    }

    // Return final tokens
    return this.generateTokens(user, true);
  }

  private sanitizeUser(user: User) {
    const sanitized = { ...user };
    delete (sanitized as any).passwordHash;
    return sanitized;
  }
}
