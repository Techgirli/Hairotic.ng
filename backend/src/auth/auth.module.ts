import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { NotificationsModule } from '../notifications/notifications.module';
import { OtpService } from './otp.service';
import { RefreshTokenService } from './refresh-token.service';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    NotificationsModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, OtpService, RefreshTokenService, OptionalJwtAuthGuard],
  exports: [AuthService, PassportModule, OtpService, RefreshTokenService, OptionalJwtAuthGuard],
})
export class AuthModule {}
