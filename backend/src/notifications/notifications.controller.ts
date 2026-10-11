import { Controller, Get, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('test-email')
  async testEmail(@Query('to') to?: string) {
    const targetEmail = to || 'olorunsolamiracle@gmail.com';
    return this.notificationsService.sendOtpEmail(
      targetEmail,
      'Miracle Olorunsola',
      '849204',
    );
  }
}
