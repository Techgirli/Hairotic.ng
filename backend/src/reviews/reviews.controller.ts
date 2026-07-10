import { Controller, Get, Post, Param, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products/:productId/reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  async getReviews(@Param('productId') productId: string) {
    return this.reviewsService.getProductReviews(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Param('productId') productId: string,
    @Req() req: any,
    @Body() body: any
  ) {
    if (body.rating === undefined || body.rating === null) {
      throw new BadRequestException('Rating is required');
    }
    return this.reviewsService.createReview(req.user.id, productId, body);
  }
}
