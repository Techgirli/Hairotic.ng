import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(private prisma: PrismaService) {}

  async createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
    device?: string,
    ip?: string,
  ): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const tokenHash = await bcrypt.hash(token, salt);

    await (this.prisma as any).refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        device,
        ip,
      },
    });

    this.logger.log(`Saved hashed refresh token for user ${userId}`);
  }

  async rotateRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string,
    newExpiresAt: Date,
    device?: string,
    ip?: string,
  ): Promise<void> {
    const activeTokens = await (this.prisma as any).refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    let matchedTokenId: string | null = null;
    for (const record of activeTokens) {
      const isMatched = await bcrypt.compare(oldToken, record.tokenHash);
      if (isMatched) {
        matchedTokenId = record.id;
        break;
      }
    }

    if (!matchedTokenId) {
      this.logger.warn(
        `Potential refresh token reuse detected for user ${userId}. Revoking all sessions!`,
      );
      await (this.prisma as any).refreshToken.deleteMany({
        where: { userId },
      });
      throw new UnauthorizedException(
        'Invalid or reused refresh token. Access revoked, please login again.',
      );
    }

    await (this.prisma as any).refreshToken.delete({
      where: { id: matchedTokenId },
    });

    await this.createRefreshToken(userId, newToken, newExpiresAt, device, ip);
    this.logger.log(`Rotated refresh token session for user ${userId}`);
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    const activeTokens = await (this.prisma as any).refreshToken.findMany({
      where: { userId },
    });

    for (const record of activeTokens) {
      const isMatched = await bcrypt.compare(token, record.tokenHash);
      if (isMatched) {
        await (this.prisma as any).refreshToken.delete({
          where: { id: record.id },
        });
        this.logger.log(`Revoked active refresh token for user ${userId}`);
        return;
      }
    }
  }

  async cleanExpiredTokens(): Promise<void> {
    const res = await (this.prisma as any).refreshToken.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
    if (res.count > 0) {
      this.logger.log(`Cleaned up ${res.count} expired refresh token sessions`);
    }
  }
}
