import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { CloudflareAdapter } from '@mridang/nestjs-platform-cloudflare';
import { AppModule } from './app.module';
import { configureApi } from './api-app';
import { assertProductionSecurityConfiguration } from './auth/auth-secrets';

interface Env {
  HYPERDRIVE?: {
    connectionString: string;
  };
  APP_URL?: string;
  CLOUDFLARE_R2_ACCOUNT_ID?: string;
  CLOUDFLARE_R2_ACCESS_KEY_ID?: string;
  CLOUDFLARE_R2_SECRET_ACCESS_KEY?: string;
  CLOUDFLARE_R2_BUCKET_NAME?: string;
  CLOUDFLARE_R2_PUBLIC_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  NODE_ENV?: string;
  PAYSTACK_SECRET_KEY?: string;
  RECONCILE_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
}

let adapterPromise: Promise<CloudflareAdapter> | undefined;

async function createAdapter(env: Env): Promise<CloudflareAdapter> {
  if (!env.HYPERDRIVE?.connectionString) {
    throw new Error('The HYPERDRIVE database binding is not configured');
  }

  const bindings = {
    APP_URL: env.APP_URL,
    CLOUDFLARE_R2_ACCOUNT_ID: env.CLOUDFLARE_R2_ACCOUNT_ID,
    CLOUDFLARE_R2_ACCESS_KEY_ID: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    CLOUDFLARE_R2_BUCKET_NAME: env.CLOUDFLARE_R2_BUCKET_NAME,
    CLOUDFLARE_R2_PUBLIC_URL: env.CLOUDFLARE_R2_PUBLIC_URL,
    DATABASE_URL: env.HYPERDRIVE.connectionString,
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    JWT_ACCESS_SECRET: env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET,
    NODE_ENV: env.NODE_ENV,
    PAYSTACK_SECRET_KEY: env.PAYSTACK_SECRET_KEY,
    RECONCILE_SECRET: env.RECONCILE_SECRET,
    RESEND_API_KEY: env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: env.RESEND_FROM_EMAIL,
  };
  for (const [name, value] of Object.entries(bindings)) {
    if (value !== undefined) process.env[name] = value;
  }
  assertProductionSecurityConfiguration();

  const adapter = new CloudflareAdapter();
  const app = await NestFactory.create(AppModule, adapter, { rawBody: true });
  configureApi(app);
  await app.init();
  return adapter;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    adapterPromise ??= createAdapter(env).catch((error: unknown) => {
      adapterPromise = undefined;
      throw error;
    });
    return (await adapterPromise).handle(request);
  },
};
