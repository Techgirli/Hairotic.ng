import {
  Controller,
  Post,
  Get,
  Body,
  Headers,
  Req,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
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
    @Req() req: any,
  ) {
    // If rawBody is enabled globally, use it. Otherwise fallback to stringify
    const rawBody = req.rawBody
      ? req.rawBody.toString()
      : JSON.stringify(req.body);
    return this.paymentsService.handleWebhook(signature, rawBody);
  }

  @Get('verify/:reference')
  async verify(@Param('reference') reference: string) {
    return this.paymentsService.verifyTransaction(reference);
  }

  /**
   * Reconciliation endpoint — called by GitHub Actions cron every 10 minutes.
   * Protected by a shared secret (RECONCILE_SECRET env var) in the
   * x-reconcile-secret header. Do NOT add JWT auth here — the cron job runs
   * without a user session.
   */
  @Post('reconcile')
  async reconcile(@Headers('x-reconcile-secret') secret: string) {
    const expectedSecret = process.env.RECONCILE_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid reconcile secret');
    }
    return this.paymentsService.reconcileStuckOrders();
  }
}

