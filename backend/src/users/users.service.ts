import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { addresses: true },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: { email?: string; phone?: string }) {
    // Basic unique checks if email/phone changed
    if (data.email) {
      const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Email is already in use');
      }
    }

    if (data.phone) {
      const existing = await this.prisma.user.findUnique({ where: { phone: data.phone } });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Phone number is already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.sanitizeUser(updated);
  }

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async addAddress(
    userId: string,
    data: { label: string; state: string; lga: string; street: string; phone: string; isDefault?: boolean }
  ) {
    const isDefault = data.isDefault === true;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault) {
        // Reset default markers on other addresses
        await tx.address.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      // If this is the user's first address, force it as default
      const addressCount = await tx.address.count({ where: { userId } });
      const finalIsDefault = addressCount === 0 ? true : isDefault;

      return tx.address.create({
        data: {
          userId,
          label: data.label,
          state: data.state,
          lga: data.lga,
          street: data.street,
          phone: data.phone,
          isDefault: finalIsDefault,
        },
      });
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new BadRequestException('You do not own this address record');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id: addressId },
      });

      // If deleted address was default, set another one as default if any remain
      if (address.isDefault) {
        const nextAddress = await tx.address.findFirst({
          where: { userId },
        });

        if (nextAddress) {
          await tx.address.update({
            where: { id: nextAddress.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }

  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new BadRequestException('You do not own this address record');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.address.update({
        where: { id: addressId },
        data: { isDefault: true },
      });
    });
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
