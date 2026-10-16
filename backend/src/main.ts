import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { assertProductionSecurityConfiguration } from './auth/auth-secrets';
import { configureApi } from './api-app';

async function bootstrap() {
  assertProductionSecurityConfiguration();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  configureApi(app);

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
