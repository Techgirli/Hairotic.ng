import { Controller, Post, Get, Body, Headers, Req, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post('initialize')
  async initialize(@Body() body: { orderId: string }) {
    return this.paymentsService.initializeTransaction(body.orderId);
  }

  @Post('webhook')
  async webhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: any
  ) {
    // If rawBody is enabled globally, use it. Otherwise fallback to stringify
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(signature, rawBody);
  }

  @Get('verify/:reference')
  async verify(@Param('reference') reference: string) {
    return this.paymentsService.verifyTransaction(reference);
  }
}
