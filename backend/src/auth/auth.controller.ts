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
      body.name,
    );
    return { success: true, user };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('password-reset/request')
  async requestPasswordReset(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

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
      this.setCookie(res, 'access_token', result.tempToken!, 15 * 60 * 1000);
      return {
        mfaRequired: true,
        mfaSetup: result.mfaSetup,
        user: result.user,
      };
    }

    const tokens = result as {
      accessToken: string;
      refreshToken: string;
      user: any;
    };
    this.setCookie(res, 'access_token', tokens.accessToken, 15 * 60 * 1000);
    this.setCookie(
      res,
      'refresh_token',
      tokens.refreshToken,
      30 * 24 * 60 * 60 * 1000,
    );

    return {
      success: true,
      mfaRequired: false,
      user: tokens.user,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('google')
  async googleLogin(
    @Body() body: { idToken: string; deviceId?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.loginWithGoogle(body.idToken, body.deviceId);

    if (result.mfaRequired) {
      return {
        success: true,
        mfaRequired: true,
        email: result.email,
      };
    }

    const tokens = result as any;

    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';
    const session = await this.authService.generateSession(
      tokens.user,
      body.deviceId,
      `${userAgent} (${ip})`,
    );

    this.setCookie(res, 'access_token', session.accessToken, 15 * 60 * 1000);
    this.setCookie(
      res,
      'refresh_token',
      session.refreshToken,
      30 * 24 * 60 * 60 * 1000,
    );

    if (body.deviceId) {
      this.setCookie(res, 'device_id', body.deviceId, 365 * 24 * 60 * 60 * 1000);
    }

    return {
      success: true,
      mfaRequired: false,
      user: tokens.user,
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('otp/verify')
  async verifyOtp(
    @Body() body: { email: string; otp: string; deviceId?: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.verifyOtpAndCreateSession(
      body.email,
      body.otp,
      body.deviceId,
      `${userAgent} (${ip})`,
    );

    this.setCookie(res, 'access_token', result.accessToken, 15 * 60 * 1000);
    this.setCookie(
      res,
      'refresh_token',
      result.refreshToken,
      30 * 24 * 60 * 60 * 1000,
    );

    if (body.deviceId) {
      this.setCookie(res, 'device_id', body.deviceId, 365 * 24 * 60 * 60 * 1000);
    }

    return {
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('otp/resend')
  async resendOtp(@Body('email') email: string) {
    return this.authService.resendOtp(email);
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

    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    const userAgent = req.headers['user-agent'] || '';
    const deviceId = req.cookies['device_id'];

    const result = await this.authService.refreshSession(
      refreshToken,
      deviceId,
      `${userAgent} (${ip})`,
    );

    this.setCookie(res, 'access_token', result.accessToken, 15 * 60 * 1000);
    this.setCookie(
      res,
      'refresh_token',
      result.refreshToken,
      30 * 24 * 60 * 60 * 1000,
    );

    return {
      success: true,
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (refreshToken) {
      try {
        const resolved = await this.authService.verifyRefresh(refreshToken);
        await this.authService.logoutSession(resolved.user.id, refreshToken);
      } catch {}
    }

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
      30 * 24 * 60 * 60 * 1000,
    );

    return { success: true, mfaVerified: true };
  }

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
    const req = res.req as any;
    const host = req?.headers?.host || '';
    const origin = req?.headers?.origin || '';
    
    // Force production settings if running on the live domain
    const isProd =
      process.env.NODE_ENV === 'production' ||
      host.includes('hairotic.com.ng') ||
      origin.includes('hairotic.com.ng');

    const useSharedDomain = isProd && !origin.includes('localhost') && !host.includes('localhost');

    res.cookie(name, token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      domain: useSharedDomain ? '.hairotic.com.ng' : undefined,
      maxAge,
      path: '/',
    });
  }

  private clearCookie(res: Response, name: string) {
    const req = res.req as any;
    const host = req?.headers?.host || '';
    const origin = req?.headers?.origin || '';
    
    const isProd =
      process.env.NODE_ENV === 'production' ||
      host.includes('hairotic.com.ng') ||
      origin.includes('hairotic.com.ng');

    const useSharedDomain = isProd && !origin.includes('localhost') && !host.includes('localhost');

    res.cookie(name, '', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      domain: useSharedDomain ? '.hairotic.com.ng' : undefined,
      expires: new Date(0),
      path: '/',
    });
  }
}
