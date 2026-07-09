import { Controller, Get, Post, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@Req() req: any) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @Post()
  async addToWishlist(@Req() req: any, @Body() body: { variantId: string }) {
    return this.wishlistService.addToWishlist(req.user.id, body.variantId);
  }

  @Delete(':variantId')
  async removeFromWishlist(@Req() req: any, @Param('variantId') variantId: string) {
    return this.wishlistService.removeFromWishlist(req.user.id, variantId);
  }
}
