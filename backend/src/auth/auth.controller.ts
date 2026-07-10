import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  async register(@Body() body: any) {
    const user = await this.authService.register(
      body.email,
      body.phone,
      body.password,
    );
    return { success: true, user };
  }

  // Email verification — called when user clicks the link in their inbox
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // Resend verification email (e.g. link expired)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  // Password reset — step 1: request a reset link
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 min
  @Post('password-reset/request')
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  // Password reset — step 2: submit new password with the token
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('password-reset/confirm')
  async confirmPasswordReset(
    @Body('token') token: string,
    @Body('password') password: string,
  ) {
    return this.authService.confirmPasswordReset(token, password);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(body.email, body.password);

    if (result.mfaRequired) {
      // If MFA is required, we set a temporary access token so they can access the verify route
      this.setCookie(res, 'access_token', result.tempToken!, 15 * 60 * 1000); // 15m
      return {
        mfaRequired: true,
        mfaSetup: result.mfaSetup,
        user: result.user,
      };
    }

    // Since mfaRequired is false, we have access and refresh tokens
    const tokens = result as {
      accessToken: string;
      refreshToken: string;
      user: any;
    };
    this.setCookie(res, 'access_token', tokens.accessToken, 15 * 60 * 1000); // 15m
    this.setCookie(
      res,
      'refresh_token',
      tokens.refreshToken,
      7 * 24 * 60 * 60 * 1000,
    ); // 7d

    return {
      success: true,
      mfaRequired: false,
      user: tokens.user,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      return { success: false, message: 'Refresh token missing' };
    }

    const { user, mfaVerified } =
      await this.authService.verifyRefresh(refreshToken);
    const tokens = this.authService.generateTokens(user, mfaVerified);

    this.setCookie(res, 'access_token', tokens.accessToken, 15 * 60 * 1000);
    this.setCookie(
      res,
      'refresh_token',
      tokens.refreshToken,
      7 * 24 * 60 * 60 * 1000,
    );

    return {
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearCookie(res, 'access_token');
    this.clearCookie(res, 'refresh_token');
    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Post('mfa/setup')
  async setupMfa(@Req() req: any) {
    return this.authService.setupMfa(req.user.id);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  async verifyMfa(
    @Req() req: any,
    @Body() body: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isSetupFlow = body.isSetupFlow === true;
    const tokens = await this.authService.verifyMfa(
      req.user.id,
      body.code,
      isSetupFlow,
    );

    this.setCookie(res, 'access_token', tokens.accessToken, 15 * 60 * 1000);
    this.setCookie(
      res,
      'refresh_token',
      tokens.refreshToken,
      7 * 24 * 60 * 60 * 1000,
    );

    return { success: true, mfaVerified: true };
  }

  // Helper route to check current login state
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Req() req: any) {
    return { user: req.user };
  }

  private setCookie(
    res: Response,
    name: string,
    token: string,
    maxAge: number,
  ) {
    res.cookie(name, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });
  }

  private clearCookie(res: Response, name: string) {
    res.cookie(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
      path: '/',
    });
  }
}
