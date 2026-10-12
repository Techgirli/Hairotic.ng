import { ServiceUnavailableException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  const r2Variables = [
    'CLOUDFLARE_R2_ACCOUNT_ID',
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_PUBLIC_URL',
  ] as const;
  const originalValues = Object.fromEntries(
    r2Variables.map((name) => [name, process.env[name]]),
  );

  afterEach(() => {
    for (const name of r2Variables) {
      const value = originalValues[name];
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  it('reports missing R2 configuration when preparing an upload', async () => {
    for (const name of r2Variables) delete process.env[name];

    const storage = new StorageService();

    await expect(
      storage.getPresignedUploadUrl('hair.jpg', 'image/jpeg'),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
