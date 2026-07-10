import { Controller, Get, Post, Patch, Delete, Body, Query, Param, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, OrderStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('orders')
  async getOrders(
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
  ) {
    return this.adminService.getOrders(status, search);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Body('note') note?: string,
    @Req() req?: any,
  ) {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return this.adminService.updateOrderStatus(id, status, req.user.id || 'ADMIN', note);
  }

  @Post('orders/:id/refund')
  async refundOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    if (!reason) {
      throw new BadRequestException('Refund reason is required');
    }
    return this.adminService.refundOrder(id, reason);
  }

  @Get('inventory')
  async getInventory() {
    return this.adminService.getInventory();
  }

  @Patch('inventory/:id')
  async adjustInventory(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
    @Body('reason') reason: string,
    @Req() req?: any,
  ) {
    if (quantity === undefined || quantity === null) {
      throw new BadRequestException('Quantity is required');
    }
    if (!reason) {
      throw new BadRequestException('Reason code is required');
    }
    return this.adminService.adjustInventory(id, quantity, reason, req.user.id || 'ADMIN');
  }

  @Get('customers')
  async getCustomers() {
    return this.adminService.getCustomers();
  }

  @Get('customers/:id')
  async getCustomerDetails(@Param('id') id: string) {
    return this.adminService.getCustomerDetails(id);
  }

  @Post('customers/:id/notes')
  async addCustomerNote(
    @Param('id') id: string,
    @Body('note') note: string,
    @Req() req?: any,
  ) {
    if (!note) {
      throw new BadRequestException('Note content is required');
    }
    return this.adminService.addCustomerNote(id, note, req.user.id || 'ADMIN');
  }

  @Get('products')
  async getProducts() {
    return this.adminService.getProducts();
  }

  @Post('products')
  async createProduct(@Body() body: any) {
    if (!body.name || !body.categoryId) {
      throw new BadRequestException('Product name and category are required');
    }
    return this.adminService.createProduct(body);
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateProduct(id, body);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }
}
