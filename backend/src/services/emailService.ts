import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev';

export class EmailService {
  static async sendInvitationEmail(
    toEmail: string,
    invitationToken: string,
    companyName: string,
    invitedByName: string
  ) {
    try {
      const invitationLink = `${process.env.FRONTEND_URL}/auth/join?token=${invitationToken}`;

      const response = await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: `You're invited to ${companyName} on Staffio`,
        html: this.invitationEmailTemplate(
          invitationLink,
          companyName,
          invitedByName
        )
      });

      if (response.error) {
        console.error('❌ Resend error:', response.error);
        throw response.error;
      }

      console.log('✅ Invitation email sent:', response.data?.id);
      return true;

    } catch (error: any) {
      console.error('❌ Email error:', error.message);
      throw error;
    }
  }

  static async sendWelcomeEmail(toEmail: string, firstName: string) {
    try {
      const response = await resend.emails.send({
        from: FROM_EMAIL,
        to: toEmail,
        subject: 'Welcome to Staffio! 👋',
        html: this.welcomeEmailTemplate(firstName)
      });

      if (response.error) {
        console.error('❌ Resend error:', response.error);
        throw response.error;
      }

      console.log('✅ Welcome email sent:', response.data?.id);
      return true;

    } catch (error: any) {
      console.error('❌ Email error:', error.message);
      throw error;
    }
  }

  static sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    name: string
  ) {
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset?token=${resetToken}`;

    return resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Reset your Staffio password',
      html: this.passwordResetTemplate(resetLink, name)
    });
  }

  // Email Templates
  private static invitationEmailTemplate(
    invitationLink: string,
    companyName: string,
    invitedByName: string
  ) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #BF092F 0%, #a00726 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
            .button { background: #BF092F; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin: 32px 0; }
            .footer { color: #999; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 32px; }
            code { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; display: inline-block; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">You're invited! 🎉</h1>
            </div>
            <div class="content">
              <p style="color: #1a2332; font-size: 16px; margin-bottom: 24px;">Hi there,</p>
              <p style="color: #666; font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
                <strong>${invitedByName}</strong> has invited you to join <strong>${companyName}</strong> on Staffio.
              </p>
              <p style="color: #666; font-size: 14px; line-height: 1.8; margin-bottom: 32px;">
                Staffio is a modern shift scheduling platform that helps teams manage schedules, requests, and communication all in one place.
              </p>
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center; margin-bottom: 24px;">
                Or copy this link: <br>
                <code>${invitationLink}</code>
              </p>
              <div class="footer">
                <p>This invitation expires in 7 days.</p>
                <p>© 2026 Staffio. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static welcomeEmailTemplate(firstName: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #1A2332 0%, #1F4A5C 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
            .button { background: #1A2332; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin: 32px 0; }
            .footer { color: #999; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Welcome to Staffio! 👋</h1>
            </div>
            <div class="content">
              <p style="color: #1a2332; font-size: 16px; margin-bottom: 24px;">Hi ${firstName},</p>
              <p style="color: #666; font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
                Welcome to Staffio! Your account is all set up and ready to go.
              </p>
              <p style="color: #666; font-size: 14px; line-height: 1.8; margin-bottom: 32px;">
                You can now log in and start managing your shifts, requesting time off, and coordinating with your team.
              </p>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/auth/login" class="button">Log In</a>
              </div>
              <div class="footer">
                <p>© 2026 Staffio. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private static passwordResetTemplate(resetLink: string, name: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #BF092F 0%, #a00726 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { background: white; padding: 40px 20px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
            .button { background: #BF092F; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; margin: 32px 0; }
            .warning { background: #fef3c7; color: #92400e; padding: 16px; border-radius: 6px; margin: 24px 0; }
            .footer { color: #999; font-size: 12px; text-align: center; margin-top: 32px; border-top: 1px solid #e5e5e5; padding-top: 32px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
            </div>
            <div class="content">
              <p style="color: #1a2332; font-size: 16px; margin-bottom: 24px;">Hi ${name},</p>
              <p style="color: #666; font-size: 14px; line-height: 1.8; margin-bottom: 24px;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <div class="warning">
                <strong>⚠️ Security Note:</strong> This link expires in 1 hour. If you didn't request this, ignore this email.
              </div>
              <div class="footer">
                <p>© 2026 Staffio. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}