import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { getAuthSecret } from './auth-secrets';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return req.cookies['access_token'] || null;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly moduleRef: ModuleRef) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: getAuthSecret('JWT_ACCESS_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(
    request: Request,
    payload: {
      sub: string;
      email: string;
      role: string;
      mfaVerified?: boolean;
    },
  ) {
    const contextId = ContextIdFactory.getByRequest(request);
    const prisma = await this.moduleRef.resolve(PrismaService, contextId, {
      strict: false,
    });
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      mfaEnabled: user.mfaEnabled,
      mfaVerified: payload.mfaVerified ?? false,
    };
  }
}
