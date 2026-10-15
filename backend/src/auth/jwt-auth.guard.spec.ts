import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard MFA enforcement', () => {
  const guard = new JwtAuthGuard();
  const context = (url: string) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ url }) }),
    }) as any;

  it('blocks a privileged temporary token before MFA is verified', () => {
    expect(() =>
      guard.handleRequest(
        null,
        { role: 'ADMIN', mfaEnabled: false, mfaVerified: false },
        null,
        context('/admin/orders'),
      ),
    ).toThrow(UnauthorizedException);
  });

  it('allows that token only on the MFA setup and verification routes', () => {
    const user = { role: 'ADMIN', mfaEnabled: false, mfaVerified: false };
    expect(
      guard.handleRequest(null, user, null, context('/auth/mfa/setup')),
    ).toBe(user);
    expect(
      guard.handleRequest(null, user, null, context('/auth/mfa/verify')),
    ).toBe(user);
  });
});
