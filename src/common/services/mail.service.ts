import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    const mailUser = this.configService.get('MAIL_USER');
    const mailPassword = this.configService.get('MAIL_PASSWORD');
    
    // Chỉ tạo transporter khi có cấu hình email đầy đủ
    if (mailUser && mailPassword && mailUser !== 'your-email@gmail.com') {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('MAIL_HOST'),
        port: this.configService.get('MAIL_PORT'),
        secure: false,
        auth: {
          user: mailUser,
          pass: mailPassword,
        },
      });
      console.log('📧 Email service initialized');
    } else {
      console.log('📧 Email not configured - will log OTP to console');
      this.transporter = null;
    }
  }

  async sendOTP(email: string, otp: string) {
    // Nếu không có transporter, log OTP ra console
    if (!this.transporter) {
      console.log(`⚠️  Email not configured - OTP for ${email} is: ${otp}`);
      return;
    }

    // Có transporter: gửi email thật
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Verify Your Email - OTP Code',
      html: `
        <h1>Email Verification</h1>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    });
  }

  async sendPasswordResetOTP(email: string, otp: string) {
    // Nếu không có transporter, log OTP ra console
    if (!this.transporter) {
      console.log(`⚠️  Email not configured - Password reset OTP for ${email} is: ${otp}`);
      return;
    }

    // Có transporter: gửi email thật
    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Password Reset Request - OTP Code',
      html: `
        <h1>Password Reset</h1>
        <p>You have requested to reset your password.</p>
        <p>Your OTP code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }
}