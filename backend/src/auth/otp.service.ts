import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private prisma: PrismaService) {}

  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async createOtp(userId: string): Promise<string> {
    const lastOtp = await (this.prisma as any).otp.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (lastOtp) {
      const secondsSinceLast = Math.floor((Date.now() - lastOtp.createdAt.getTime()) / 1000);
      if (secondsSinceLast < 60) {
        this.logger.warn(`OTP resend rate limited: User ${userId} requested code after ${secondsSinceLast}s`);
        throw new BadRequestException(`Please wait ${60 - secondsSinceLast} seconds before requesting a new code.`);
      }
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentOtps = await (this.prisma as any).otp.count({
      where: {
        userId,
        createdAt: { gte: tenMinutesAgo },
      },
    });

    if (recentOtps >= 5) {
      this.logger.warn(`User ${userId} exceeded maximum OTP resends limit (5 requests in 10 minutes)`);
      throw new BadRequestException('Too many OTP requests. Please wait 10 minutes before trying again.');
    }

    await (this.prisma as any).otp.deleteMany({
      where: { userId },
    });

    const rawOtp = this.generateOtpCode();
    const salt = await bcrypt.genSalt(12);
    const codeHash = await bcrypt.hash(rawOtp, salt);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await (this.prisma as any).otp.create({
      data: {
        userId,
        codeHash,
        expiresAt,
        attempts: 0,
      },
    });

    this.logger.log(`Generated new OTP code for user ${userId}`);
    return rawOtp;
  }

  async verifyOtp(email: string, code: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn(`OTP verification failed: User not found for email ${email}`);
      throw new BadRequestException('Invalid email or OTP');
    }

    const activeOtp = await (this.prisma as any).otp.findFirst({
      where: { userId: user.id },
    });

    if (!activeOtp) {
      this.logger.warn(`OTP verification failed: No active OTP for user ${user.id}`);
      throw new BadRequestException('Invalid or expired OTP code. Please request a new one.');
    }

    if (new Date() > activeOtp.expiresAt) {
      await (this.prisma as any).otp.delete({ where: { id: activeOtp.id } });
      this.logger.warn(`OTP verification failed: OTP expired for user ${user.id}`);
      throw new BadRequestException('OTP code has expired. Please request a new one.');
    }

    if (activeOtp.attempts >= 5) {
      await (this.prisma as any).otp.delete({ where: { id: activeOtp.id } });
      this.logger.warn(`OTP verification failed: Max attempts exceeded for user ${user.id}`);
      throw new BadRequestException('Too many failed attempts. Please request a new OTP code.');
    }

    const isCodeValid = await bcrypt.compare(code, activeOtp.codeHash);
    if (!isCodeValid) {
      const updatedOtp = await (this.prisma as any).otp.update({
        where: { id: activeOtp.id },
        data: { attempts: activeOtp.attempts + 1 },
      });

      this.logger.warn(`OTP verification failed: Incorrect code for user ${user.id}. Attempt ${updatedOtp.attempts}/5`);

      if (updatedOtp.attempts >= 5) {
        await (this.prisma as any).otp.delete({ where: { id: activeOtp.id } });
        throw new BadRequestException('Too many failed attempts. Please request a new OTP code.');
      }

      throw new BadRequestException('Incorrect OTP code');
    }

    await (this.prisma as any).otp.delete({ where: { id: activeOtp.id } });
    this.logger.log(`OTP successfully verified for user ${user.id}`);
    return user.id;
  }
}
