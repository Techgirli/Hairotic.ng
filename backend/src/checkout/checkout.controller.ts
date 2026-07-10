import { Controller, Post, Body, Req } from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';

interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  state: string;
  lga: string;
  street: string;
}

@Controller('checkout')
export class CheckoutController {
  constructor(
    private checkoutService: CheckoutService,
    private jwtService: JwtService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post()
  async checkout(
    @Req() req: Request,
    @Body()
    body: {
      shippingAddress: ShippingAddress;
      idempotencyKey: string;
      sessionId?: string;
    }
  ) {
    const userId = this.getUserIdFromCookie(req);
    return this.checkoutService.createOrder(userId, body.sessionId, {
      shippingAddress: body.shippingAddress,
      idempotencyKey: body.idempotencyKey,
    });
  }

  private getUserIdFromCookie(req: Request): string | undefined {
    const token = req.cookies['access_token'];
    if (!token) return undefined;
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key',
      });
      return payload.sub;
    } catch (e) {
      return undefined;
    }
  }
}
