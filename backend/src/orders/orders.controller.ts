import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get('track')
  async trackOrder(
    @Query('orderNumber') orderNumber: string,
    @Query('email') email?: string,
    @Query('phone') phone?: string,
  ) {
    if (!orderNumber) {
      throw new BadRequestException('Order number is required');
    }
    if (!email && !phone) {
      throw new BadRequestException(
        'Email or phone number is required to verify ownership',
      );
    }

    return this.ordersService.trackOrder(orderNumber, { email, phone });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getOrders(@Req() req: any) {
    return this.ordersService.getOrdersForCustomer(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderDetails(@Param('id') id: string, @Req() req: any) {
    return this.ordersService.getOrderDetails(id, req.user.id);
  }
}
