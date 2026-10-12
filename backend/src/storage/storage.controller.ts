import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { StorageService } from './storage.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async getPresignedUrl(
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
  ) {
    if (
      !fileName ||
      fileName.length > 255 ||
      !/^[\w.-]+$/.test(fileName) ||
      !['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'].includes(mimeType)
    ) {
      throw new BadRequestException('Invalid image file details');
    }
    return this.storageService.getPresignedUploadUrl(fileName, mimeType);
  }
}
