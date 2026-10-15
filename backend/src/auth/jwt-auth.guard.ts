import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Authentication credentials invalid or missing',
        )
      );
    }

    const request = context.switchToHttp().getRequest();
    const isMfaRoute =
      request.url.includes('/auth/mfa/verify') ||
      request.url.includes('/auth/mfa/setup');
    const isPrivileged =
      user.role === 'ADMIN' ||
      user.role === 'STAFF' ||
      user.role === 'SUPER_ADMIN';

    if ((isPrivileged || user.mfaEnabled) && !user.mfaVerified && !isMfaRoute) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Multi-factor authentication check required',
        error: 'MFA_REQUIRED',
      });
    }

    return user;
  }
}
