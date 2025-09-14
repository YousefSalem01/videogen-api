import nodemailer from 'nodemailer';
import { EmailOptions } from '../types';

/**
 * Real Email Service with SMTP Support
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string = '';
  private appName: string = '';
  private appUrl: string = '';
  private isProduction: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Don't initialize immediately - wait for first use
  }

  private initialize() {
    if (this.initialized) return;

    this.fromEmail = process.env.EMAIL_FROM || 'noreply@aivideogen.com';
    this.appName = process.env.APP_NAME || 'AI VideoGen';
    this.appUrl = process.env.APP_URL || 'http://localhost:5173';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    this.setupTransporter();
    this.initialized = true;
  }

  /**
   * Setup email transporter based on environment
   */
  private setupTransporter(): void {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    } else {
      this.setupEtherealEmail();
    }
  }

  /**
   * Setup Ethereal Email for development testing
   */
  private async setupEtherealEmail(): Promise<void> {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (error) {
      this.transporter = null;
    }
  }

  /**
   * Generate 6-digit verification code
   */
  generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send email with real SMTP or console fallback
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    this.initialize();
    
    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: `"${this.appName}" <${this.fromEmail}>`,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html,
        });

        if (!this.isProduction) {
          console.log('📧 Email sent successfully!');
          console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
        }

        return true;
      } else {
        this.logEmailToConsole(options);
        return true;
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      this.logEmailToConsole(options);
      return false;
    }
  }

  /**
   * Console fallback for email logging
   */
  private logEmailToConsole(options: EmailOptions): void {
    if (!this.isProduction) {
      console.log(`📧 Email fallback: ${options.subject} → ${options.to}`);
    }
  }

  /**
   * Send verification code email
   */
  async sendVerificationCode(email: string, name: string, code: string): Promise<boolean> {
    const subject = `Your ${this.appName} Verification Code: ${code}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🎬 ${this.appName}</h1>
        </div>

        <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Email Verification Required 📧</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${name},
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Thank you for signing up for ${this.appName}! To complete your registration, 
            please enter the verification code below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #2563eb; color: white; padding: 20px; border-radius: 10px; 
                        display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
              ${code}
            </div>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            <strong>This code will expire in 10 minutes.</strong>
          </p>

          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you didn't request this verification, please ignore this email.
          </p>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© 2024 ${this.appName}. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
      ${this.appName} - Email Verification
      
      Hi ${name},
      
      Your verification code is: ${code}
      
      This code will expire in 10 minutes.
      
      If you didn't request this verification, please ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send password reset code email
   */
  async sendPasswordResetCode(email: string, name: string, code: string): Promise<boolean> {
    const subject = `Your ${this.appName} Password Reset Code: ${code}`;
    
    const html = `
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
            Please enter the verification code below to reset your password:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #ef4444; color: white; padding: 20px; border-radius: 10px; 
                        display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px;">
              ${code}
            </div>
          </div>

          <p style="color: #64748b; font-size: 14px;">
            <strong>This code will expire in 10 minutes.</strong>
          </p>

          <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
            If you didn't request this password reset, please ignore this email.
            Your password will remain unchanged.
          </p>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© 2024 ${this.appName}. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
      ${this.appName} - Password Reset
      
      Hi ${name},
      
      Your password reset code is: ${code}
      
      This code will expire in 10 minutes.
      
      If you didn't request this password reset, please ignore this email.
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  /**
   * Send welcome email after successful verification
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const subject = `Welcome to ${this.appName}! 🎉`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin: 0;">🎬 ${this.appName}</h1>
        </div>

        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
          <h2 style="color: #1e293b; margin-top: 0;">Welcome to ${this.appName}! 🎉</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${name},
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Congratulations! Your email has been verified and your account is now active.
            You can now start creating amazing AI-generated videos!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${this.appUrl}/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none;
                      border-radius: 6px; display: inline-block; font-weight: bold;">
              Start Creating Videos
            </a>
          </div>

          <p style="color: #475569; line-height: 1.6;">
            Here's what you can do with your free account:
          </p>
          <ul style="color: #475569; line-height: 1.6;">
            <li>Generate up to 3 videos per month</li>
            <li>Access to basic templates</li>
            <li>720p video quality</li>
            <li>Community support</li>
          </ul>
        </div>

        <div style="text-align: center; color: #94a3b8; font-size: 12px;">
          <p>© 2024 ${this.appName}. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
      Welcome to ${this.appName}!
      
      Hi ${name},
      
      Congratulations! Your email has been verified and your account is now active.
      You can now start creating amazing AI-generated videos!
      
      Visit: ${this.appUrl}/dashboard
      
      What you can do with your free account:
      - Generate up to 3 videos per month
      - Access to basic templates
      - 720p video quality
      - Community support
    `;

    return await this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
