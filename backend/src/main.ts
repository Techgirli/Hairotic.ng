import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Set global API prefix
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // Register cookie parser
  app.use(cookieParser());

  // Handle Chrome's Private Network Access preflight checks (Access-Control-Allow-Private-Network)
  app.use((req: Request, res: Response, next: NextFunction) => {
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
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow if no origin (e.g. server-to-server) or matches allowedOrigins list
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow local network IP addresses (useful for local mobile testing)
      const isLocalOrNetwork = 
        /^http:\/\/localhost:\d+$/.test(origin) || 
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) || 
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) || 
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) || 
        /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin);

      if (isLocalOrNetwork) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
