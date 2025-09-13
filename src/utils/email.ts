import { EmailOptions } from '../types';

/**
 * Email Service Class
 * For local development, we'll log emails to console
 * In production, you can integrate with services like SendGrid, Mailgun, etc.
 */
class EmailService {
  private emailProvider: string;
  private fromEmail: string;
  private appName: string;
  private appUrl: string;

  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'console';
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@aivideogen.local';
    this.appName = process.env.APP_NAME || 'AI VideoGen';
    this.appUrl = process.env.APP_URL || 'http://localhost:5173';
  }

  /**
   * Send Email (Console version for local development)
   */
  private async sendEmailConsole(options: EmailOptions): Promise<void> {
    console.log('\n📧 ===== EMAIL SENT =====');
    console.log(`From: ${this.fromEmail}`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('--- Content ---');
    console.log(options.html || options.text);
    console.log('========================\n');
  }

  /**
   * Send Generic Email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (this.emailProvider === 'console') {
        await this.sendEmailConsole(options);
      } else {
        // TODO: Implement real email service integration
        console.log('Real email service not configured. Using console fallback.');
        await this.sendEmailConsole(options);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send Welcome Email
   */
  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    const options: EmailOptions = {
      to,
      subject: `Welcome to ${this.appName}! 🎉`,
      html: this.getWelcomeEmailTemplate(name),
    };

    await this.sendEmail(options);
  }

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(to: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${resetToken}`;
    
    const options: EmailOptions = {
      to,
      subject: `Reset Your ${this.appName} Password 🔐`,
      html: this.getPasswordResetEmailTemplate(name, resetUrl),
    };

    await this.sendEmail(options);
  }

  /**
   * Send Password Reset Success Email
   */
  async sendPasswordResetSuccessEmail(to: string, name: string): Promise<void> {
    const options: EmailOptions = {
      to,
      subject: `Your ${this.appName} Password Has Been Reset ✅`,
      html: this.getPasswordResetSuccessEmailTemplate(name),
    };

    await this.sendEmail(options);
  }

  /**
   * Send Email Verification Email
   */
  async sendEmailVerificationEmail(to: string, name: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.appUrl}/verify-email?token=${verificationToken}`;
    
    const options: EmailOptions = {
      to,
      subject: `Verify Your ${this.appName} Email Address 📧`,
      html: this.getEmailVerificationTemplate(name, verificationUrl),
    };

    await this.sendEmail(options);
  }

  /**
   * Welcome Email Template
   */
  private getWelcomeEmailTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🎬 ${this.appName}</h1>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${name}! 🎉</h2>
          <p style="color: #475569; line-height: 1.6;">
            Thank you for joining ${this.appName}! We're excited to help you create amazing AI-generated videos 
            for your social media platforms.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${this.appUrl}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Get Started
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you have any questions, feel free to reach out to our support team.
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© 2024 ${this.appName}. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Password Reset Email Template
   */
  private getPasswordResetEmailTemplate(name: string, resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🎬 ${this.appName}</h1>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request 🔐</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${name},
          </p>
          <p style="color: #475569; line-height: 1.6;">
            We received a request to reset your password for your ${this.appName} account. 
            Click the button below to reset your password:
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            <strong>This link will expire in 10 minutes.</strong>
          </p>
          
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you didn't request this password reset, please ignore this email. 
            Your password will remain unchanged.
          </p>
        </div>
        
        <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© 2024 ${this.appName}. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Password Reset Success Email Template
   */
  private getPasswordResetSuccessEmailTemplate(name: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🎬 ${this.appName}</h1>
        </div>
        
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Password Reset Successful ✅</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${name},
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Your password has been successfully reset for your ${this.appName} account.
            You can now log in with your new password.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${this.appUrl}/login" 
               style="background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Login Now
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you didn't make this change, please contact our support team immediately.
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© 2024 ${this.appName}. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  /**
   * Email Verification Template
   */
  private getEmailVerificationTemplate(name: string, verificationUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🎬 ${this.appName}</h1>
        </div>
        
        <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Verify Your Email Address 📧</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${name},
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Please verify your email address to complete your ${this.appName} account setup.
            Click the button below to verify your email:
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Verify Email
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you didn't create an account with us, please ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© 2024 ${this.appName}. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
