const developmentSecrets: Record<string, string> = {
  JWT_ACCESS_SECRET: 'development-only-access-secret-change-me',
  JWT_REFRESH_SECRET: 'development-only-refresh-secret-change-me',
};

export function getAuthSecret(name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
  const value = process.env[name]?.trim();
  if (value) return value;

  if (process.env.NODE_ENV !== 'production') {
    return developmentSecrets[name];
  }

  throw new Error(`${name} must be configured in production`);
}

export function assertProductionSecurityConfiguration(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const required = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'PAYSTACK_SECRET_KEY',
    'RECONCILE_SECRET',
    'GOOGLE_CLIENT_ID',
  ];
  const missing = required.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing required production security configuration: ${missing.join(', ')}`);
  }
}
