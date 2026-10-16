import { RequestMethod, type INestApplication } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';

export function configureApi(app: INestApplication): void {
  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      req.headers['access-control-request-private-network'] === 'true' ||
      req.method === 'OPTIONS'
    ) {
      res.setHeader('Access-Control-Allow-Private-Network', 'true');
    }
    next();
  });

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://hairotic-ng.vercel.app',
    'https://www.hairotic.com.ng',
    'https://hairotic.com.ng',
  ];
  if (process.env.APP_URL) {
    const sanitizedUrl = process.env.APP_URL.replace(/\/$/, '');
    if (!allowedOrigins.includes(sanitizedUrl)) {
      allowedOrigins.push(sanitizedUrl);
    }
  }

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const isLocalOrNetwork =
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin) ||
        /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin);
      const isAllowedDomain =
        /\.vercel\.(app|com)$/.test(origin) ||
        /\.pages\.dev$/.test(origin) ||
        /hairotic\.(ng|com\.ng)$/.test(origin) ||
        /\.hairotic\.(ng|com\.ng)$/.test(origin);

      return callback(
        isLocalOrNetwork || isAllowedDomain
          ? null
          : new Error(`Origin ${origin} not allowed by CORS`),
        isLocalOrNetwork || isAllowedDomain,
      );
    },
    credentials: true,
  });
}
