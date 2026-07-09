import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
