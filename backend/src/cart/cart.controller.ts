import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('cart')
export class CartController {
  constructor(
    private cartService: CartService,
    private jwtService: JwtService,
  ) {}

  @Get()
  async getCart(@Req() req: Request, @Query('sessionId') sessionId?: string) {
    const userId = this.getUserIdFromCookie(req);
    return this.cartService.getOrCreateCart(userId, sessionId);
  }

  @Post('items')
  async addItem(
    @Req() req: Request,
    @Body() body: { variantId: string; quantity: number; sessionId?: string },
  ) {
    const userId = this.getUserIdFromCookie(req);
    const cart = await this.cartService.getOrCreateCart(userId, body.sessionId);
    await this.cartService.addItem(cart.id, body.variantId, body.quantity);
    return this.cartService.getOrCreateCart(userId, body.sessionId);
  }

  @Patch('items/:itemId')
  async updateQuantity(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number; sessionId?: string },
  ) {
    const userId = this.getUserIdFromCookie(req);
    await this.cartService.updateQuantity(itemId, body.quantity);
    return this.cartService.getOrCreateCart(userId, body.sessionId);
  }

  @Delete('items/:itemId')
  async removeItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    const userId = this.getUserIdFromCookie(req);
    await this.cartService.removeItem(itemId);
    return this.cartService.getOrCreateCart(userId, sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('merge')
  async mergeCarts(@Req() req: any, @Body() body: { sessionId: string }) {
    return this.cartService.mergeCarts(body.sessionId, req.user.id);
  }

  private getUserIdFromCookie(req: Request): string | undefined {
    const token = req.cookies['access_token'];
    if (!token) return undefined;
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key',
      });
      return payload.sub;
    } catch {
      return undefined;
    }
  }
}
