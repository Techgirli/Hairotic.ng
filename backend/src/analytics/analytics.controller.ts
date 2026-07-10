import { Controller, Get, Post, Body, UseGuards, Query, Req, Res } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('events')
  async logEvent(@Body() body: any) {
    const { name, properties, userId, sessionId } = body;
    if (!name) {
      return { success: false, message: 'Event name is required' };
    }
    await this.analyticsService.logEvent(name, properties, userId, sessionId);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('summary')
  async getSummaryStats() {
    return this.analyticsService.getSummaryStats();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('funnel')
  async getFunnelMetrics() {
    return this.analyticsService.getFunnelMetrics();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('export')
  async getExportData() {
    return this.analyticsService.getExportData();
  }
}
