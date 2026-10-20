import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable({ scope: Scope.REQUEST })
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/hairotic?schema=public';
    super({ adapter: new PrismaPg({ connectionString }) });
  }
}
