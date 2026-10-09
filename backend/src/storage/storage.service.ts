import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly publicDomain: string;

  constructor() {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'hairotic-media';
    this.publicDomain =
      process.env.CLOUDFLARE_R2_PUBLIC_URL || `https://media.hairotic.ng`;

    // Cloudflare R2 S3-Compatible Endpoint
    const endpoint = accountId
      ? `https://${accountId}.r2.cloudflarestorage.com`
      : 'https://r2.cloudflarestorage.com';

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload a file buffer directly to Cloudflare R2
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const key = `uploads/${Date.now()}-${fileName}`;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: mimeType,
        }),
      );

      const fileUrl = `${this.publicDomain}/${key}`;
      this.logger.log(`Uploaded file to Cloudflare R2: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Cloudflare R2 upload failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Generate a presigned URL for direct client-to-R2 upload
   */
  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const key = `uploads/${Date.now()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });
    const fileUrl = `${this.publicDomain}/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  /**
   * Delete an object from Cloudflare R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      this.logger.log(`Deleted file from Cloudflare R2: ${key}`);
    } catch (error) {
      this.logger.error(`Cloudflare R2 delete failed for ${key}:`, error);
      throw error;
    }
  }
}
