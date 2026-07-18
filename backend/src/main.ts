import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Set global API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // Register cookie parser
  app.use(cookieParser());

  // Handle Chrome's Private Network Access preflight checks (Access-Control-Allow-Private-Network)
  app.use((req, res, next) => {
    if (req.headers['access-control-request-private-network'] === 'true') {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  // Enable CORS with credentials support
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://hairotic-ng.vercel.app',
  ];
  if (process.env.APP_URL) {
    allowedOrigins.push(process.env.APP_URL);
    const sanitizedUrl = process.env.APP_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(sanitizedUrl)) {
      allowedOrigins.push(sanitizedUrl);
    }
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
