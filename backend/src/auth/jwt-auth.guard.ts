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
    const isMfaVerifyRoute = request.url.includes('/auth/mfa/verify');

    if (user.mfaEnabled && !user.mfaVerified && !isMfaVerifyRoute) {
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Multi-factor authentication check required',
        error: 'MFA_REQUIRED',
      });
    }

    return user;
  }
}
