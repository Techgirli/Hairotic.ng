import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MarketingService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getFaqs() {
    return this.prisma.faq.findMany({
      orderBy: { position: 'asc' },
    });
  }

  async createFaq(data: {
    question: string;
    answer: string;
    category: string;
    position?: number;
  }) {
    return this.prisma.faq.create({
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        position: data.position ?? 0,
      },
    });
  }

  async deleteFaq(id: string) {
    return this.prisma.faq.delete({
      where: { id },
    });
  }

  async submitContact(data: { name: string; email: string; message: string }) {
    await this.notificationsService.sendContactInquiryEmail(
      data.name,
      data.email,
      data.message,
    );
    return { success: true, message: 'Contact message forwarded successfully' };
  }
}
