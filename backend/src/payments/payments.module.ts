import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { OutboxDispatcherService } from './outbox-dispatcher.service';

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, OutboxDispatcherService],
  exports: [PaymentsService, OutboxDispatcherService],
})
export class PaymentsModule {}
