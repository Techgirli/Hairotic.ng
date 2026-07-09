import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  async sendOrderConfirmationEmail(order: any) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const itemsHtml = order.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.variant.product.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.variant.attributes.length || 'Default'}"</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">₦${(item.unitPrice / 100).toLocaleString()}</td>
      </tr>`
      )
      .join('');

    const htmlContent = `
      <div style="font-family: sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #22222210; border-radius: 12px;">
        <h2 style="color: #E56717; text-transform: uppercase; letter-spacing: 1px;">Hairotic.ng</h2>
        <h3 style="border-bottom: 2px solid #E56717; padding-bottom: 10px;">Order Confirmation</h3>
        <p>Hello <strong>${order.shippingName}</strong>,</p>
        <p>Thank you for shopping with Hairotic! Your order has been placed successfully.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #FAF7F4;">
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
              <th style="padding: 8px; text-align: left; border-bottom: 2px solid #ddd;">Length</th>
              <th style="padding: 8px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 8px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; text-align: right; font-size: 15px; line-height: 1.6;">
          <p>Subtotal: <strong>₦${(order.subtotal / 100).toLocaleString()}</strong></p>
          <p>Delivery Fee: <strong>₦${(order.deliveryFee / 100).toLocaleString()}</strong></p>
          <p style="font-size: 18px; color: #E56717; font-weight: bold;">Total Paid: ₦${(order.total / 100).toLocaleString()}</p>
        </div>

        <div style="margin-top: 30px; padding: 15px; bg-color: #FAF7F4; border-radius: 8px; font-size: 13px;">
          <p><strong>Shipping Details:</strong></p>
          <p>${order.shippingStreet}, ${order.shippingLga}, ${order.shippingState} State</p>
          <p>Phone: ${order.shippingPhone}</p>
        </div>

        <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
          © 2026 Hairotic.ng. Lekki Phase 1, Lagos, Nigeria.
        </p>
      </div>
    `;

    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY is not defined. Printing order invoice email to console fallback:');
      this.logger.log(`\n--- INVOICE EMAIL TO: ${order.shippingEmail} ---\nSubject: Order Confirmed - ${order.orderNumber}\n${htmlContent}\n------------------------`);
      return { success: true, message: 'Printed invoice to console logs fallback.' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Hairotic.ng <orders@hairotic.ng>',
          to: [order.shippingEmail],
          subject: `Order Confirmed - ${order.orderNumber}`,
          html: htmlContent,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText);
      }

      this.logger.log(`Order confirmation email sent successfully for ${order.orderNumber}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send Resend email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendWhatsAppNotification(phone: string, message: string) {
    this.logger.log(`[WHATSAPP NOTIFICATION TRIGGERED] To: ${phone} -> Message: "${message}"`);
    return { success: true };
  }
}
