import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller()
export class MarketingController {
  constructor(private marketingService: MarketingService) {}

  @Get('faqs')
  async getFaqs() {
    return this.marketingService.getFaqs();
  }

  @Post('contact')
  async submitContact(@Body() body: any) {
    if (!body.name || !body.email || !body.message) {
      throw new BadRequestException(
        'Name, email, and message content are required',
      );
    }
    return this.marketingService.submitContact(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('admin/faqs')
  async createFaq(@Body() body: any) {
    if (!body.question || !body.answer || !body.category) {
      throw new BadRequestException(
        'Question, answer, and category fields are required',
      );
    }
    return this.marketingService.createFaq(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Delete('admin/faqs/:id')
  async deleteFaq(@Param('id') id: string) {
    await this.marketingService.deleteFaq(id);
    return { success: true, message: 'FAQ entry removed' };
  }
}
