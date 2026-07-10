import { Controller, Get, Patch, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  async updateProfile(@Req() req: any, @Body() body: any) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Get('me/addresses')
  async getAddresses(@Req() req: any) {
    return this.usersService.getAddresses(req.user.id);
  }

  @Post('me/addresses')
  async addAddress(@Req() req: any, @Body() body: any) {
    return this.usersService.addAddress(req.user.id, body);
  }

  @Delete('me/addresses/:id')
  async deleteAddress(@Req() req: any, @Param('id') id: string) {
    await this.usersService.deleteAddress(req.user.id, id);
    return { success: true, message: 'Address record deleted' };
  }

  @Patch('me/addresses/:id/default')
  async setDefaultAddress(@Req() req: any, @Param('id') id: string) {
    return this.usersService.setDefaultAddress(req.user.id, id);
  }
}
