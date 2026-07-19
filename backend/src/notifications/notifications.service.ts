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
      </tr>`,
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
      this.logger.warn(
        'RESEND_API_KEY is not defined. Printing order invoice email to console fallback:',
      );
      this.logger.log(
        `\n--- INVOICE EMAIL TO: ${order.shippingEmail} ---\nSubject: Order Confirmed - ${order.orderNumber}\n${htmlContent}\n------------------------`,
      );
      return {
        success: true,
        message: 'Printed invoice to console logs fallback.',
      };
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

      this.logger.log(
        `Order confirmation email sent successfully for ${order.orderNumber}`,
      );
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send Resend email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  sendWhatsAppNotification(phone: string, message: string) {
    this.logger.log(
      `[WHATSAPP NOTIFICATION TRIGGERED] To: ${phone} -> Message: "${message}"`,
    );
    return Promise.resolve({ success: true });
  }

  async sendOrderStatusUpdateNotification(
    order: any,
    status: string,
    note?: string,
  ) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const trackingNote = note
      ? `<p><strong>Note from courier/staff:</strong> ${note}</p>`
      : '';

    const htmlContent = `
      <div style="font-family: sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #22222210; border-radius: 12px;">
        <h2 style="color: #E56717; text-transform: uppercase; letter-spacing: 1px;">Hairotic.ng</h2>
        <h3 style="border-bottom: 2px solid #E56717; padding-bottom: 10px;">Order Status Update</h3>
        <p>Hello <strong>${order.shippingName}</strong>,</p>
        <p>Your order <strong>${order.orderNumber}</strong> has been updated to: <strong style="color: #E56717; text-transform: uppercase;">${status}</strong>.</p>
        
        ${trackingNote}

        <p>You can track your order live on our store at any time using this tracking number: <strong>${order.orderNumber}</strong>.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
          © 2026 Hairotic.ng. Lekki Phase 1, Lagos, Nigeria.
        </p>
      </div>
    `;

    if (!resendApiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not defined. Printing order status update email to console fallback:',
      );
      this.logger.log(
        `\n--- STATUS UPDATE EMAIL TO: ${order.shippingEmail} ---\nSubject: Order ${order.orderNumber} Update: ${status}\n${htmlContent}\n------------------------`,
      );
    } else {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Hairotic.ng <orders@hairotic.ng>',
            to: [order.shippingEmail],
            subject: `Order ${order.orderNumber} Update - ${status}`,
            html: htmlContent,
          }),
        });
        this.logger.log(
          `Order status update email sent successfully for ${order.orderNumber}`,
        );
      } catch (err: any) {
        this.logger.error(`Failed to send status update email: ${err.message}`);
      }
    }

    // Send WhatsApp notification
    const whatsappMsg = `Hi ${order.shippingName}! Your order ${order.orderNumber} has been updated to: ${status}.${note ? ` Note: ${note}` : ''} Track it live at http://localhost:3000/orders/track?orderNumber=${order.orderNumber}&email=${encodeURIComponent(order.shippingEmail || '')}`;
    await this.sendWhatsAppNotification(
      order.shippingPhone || '',
      whatsappMsg,
    ).catch((e) =>
      this.logger.error(`Failed to send WhatsApp status update: ${e.message}`),
    );
  }

  async sendContactInquiryEmail(name: string, email: string, message: string) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const htmlContent = `
      <div style="font-family: sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #22222210; border-radius: 12px;">
        <h2 style="color: #E56717; text-transform: uppercase; letter-spacing: 1px;">Hairotic.ng</h2>
        <h3 style="border-bottom: 2px solid #E56717; padding-bottom: 10px;">New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p style="background-color: #FAF7F4; padding: 15px; border-radius: 8px; font-style: italic;">
          ${message}
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
          © 2026 Hairotic.ng.
        </p>
      </div>
    `;

    if (!resendApiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not defined. Printing contact form email to console fallback:',
      );
      this.logger.log(
        `\n--- CONTACT EMAIL FROM: ${email} ---\nSubject: New Contact Submission from ${name}\n${htmlContent}\n------------------------`,
      );
    } else {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'Hairotic.ng Contact <contact@hairotic.ng>',
            to: ['support@hairotic.ng'],
            subject: `New Contact Submission from ${name}`,
            html: htmlContent,
          }),
        });
        this.logger.log(
          `Contact inquiry email sent successfully from ${email}`,
        );
      } catch (err: any) {
        this.logger.error(`Failed to send contact email: ${err.message}`);
      }
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const verifyUrl = `${appUrl}/account/verify-email?token=${token}`;

    const htmlContent = `
      <div style="font-family: sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #22222210; border-radius: 12px;">
        <h2 style="color: #E56717; text-transform: uppercase; letter-spacing: 1px;">Hairotic.ng</h2>
        <h3 style="border-bottom: 2px solid #E56717; padding-bottom: 10px;">Verify Your Email Address</h3>
        <p>Thanks for signing up! Please confirm your email address to activate your account.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${verifyUrl}"
            style="background-color: #E56717; color: white; padding: 14px 32px; border-radius: 8px;
                   text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="font-size: 13px; color: #6B7280;">
          This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
        <p style="font-size: 13px; color: #6B7280;">
          Or copy this link into your browser: <br/>
          <a href="${verifyUrl}" style="color: #E56717;">${verifyUrl}</a>
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
          © 2026 Hairotic.ng. Lekki Phase 1, Lagos, Nigeria.
        </p>
      </div>
    `;

    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY not set — verification email console fallback:');
      this.logger.log(`\n--- VERIFY EMAIL TO: ${email} ---\nLink: ${verifyUrl}\n------------------------`);
      return { success: true };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({
          from: `Hairotic.ng <${fromEmail}>`,
          to: [email],
          subject: 'Verify your Hairotic.ng email address',
          html: htmlContent,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      this.logger.log(`Verification email sent to ${email}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send verification email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/account/reset-password?token=${token}`;

    const htmlContent = `
      <div style="font-family: sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #22222210; border-radius: 12px;">
        <h2 style="color: #E56717; text-transform: uppercase; letter-spacing: 1px;">Hairotic.ng</h2>
        <h3 style="border-bottom: 2px solid #E56717; padding-bottom: 10px;">Reset Your Password</h3>
        <p>We received a request to reset the password for your account. Click the button below to set a new password.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetUrl}"
            style="background-color: #E56717; color: white; padding: 14px 32px; border-radius: 8px;
                   text-decoration: none; font-weight: bold; font-size: 15px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 13px; color: #6B7280;">
          This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
        </p>
        <p style="font-size: 13px; color: #6B7280;">
          Or copy this link: <br/>
          <a href="${resetUrl}" style="color: #E56717;">${resetUrl}</a>
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
          © 2026 Hairotic.ng. Lekki Phase 1, Lagos, Nigeria.
        </p>
      </div>
    `;

    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY not set — password reset email console fallback:');
      this.logger.log(`\n--- RESET EMAIL TO: ${email} ---\nLink: ${resetUrl}\n------------------------`);
      return { success: true };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({
          from: `Hairotic.ng <${fromEmail}>`,
          to: [email],
          subject: 'Reset your Hairotic.ng password',
          html: htmlContent,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      this.logger.log(`Password reset email sent to ${email}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send password reset email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  async sendOtpEmail(email: string, name: string, otp: string) {
    const resendApiKey = process.env.RESEND_API_KEY;

    const htmlContent = `
      <div style="font-family: sans-serif; color: #222; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #22222210; border-radius: 12px;">
        <h2 style="color: #E56717; text-transform: uppercase; letter-spacing: 1px;">Hairotic.ng</h2>
        <h3 style="border-bottom: 2px solid #E56717; padding-bottom: 10px;">Verify your login</h3>
        <p>Hello ${name || 'Customer'},</p>
        <p>Use the code below to verify your login.</p>
        <div style="margin: 30px 0; text-align: center;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #E56717;
                       background-color: #FAF7F4; padding: 12px 24px; border-radius: 8px; border: 1px dashed #E56717; display: inline-block;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 13px; color: #6B7280;">
          Expires in 10 minutes.
        </p>
        <p style="font-size: 13px; color: #6B7280; margin-top: 20px;">
          If this wasn't you, ignore this email.
        </p>
        <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
          © 2026 Hairotic.ng. Lekki Phase 1, Lagos, Nigeria.
        </p>
      </div>
    `;

    if (!resendApiKey) {
      this.logger.warn('RESEND_API_KEY not set — OTP email console fallback:');
      this.logger.log(`\n--- OTP EMAIL TO: ${email} ---\nOTP: ${otp}\n------------------------`);
      return { success: true };
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
        body: JSON.stringify({
          from: `Hairotic.ng <${fromEmail}>`,
          to: [email],
          subject: 'Verify your login',
          html: htmlContent,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      this.logger.log(`OTP email sent to ${email}`);
      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send OTP email: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
