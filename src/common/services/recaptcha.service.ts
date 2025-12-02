import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaService {
  constructor(private configService: ConfigService) {}

  async verifyRecaptcha(token: string): Promise<boolean> {
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    
    // Kiểm tra nếu không có secret key hoặc đang dùng test key của Google
    if (!secretKey || secretKey === '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe') {
      console.log('⚠️  reCAPTCHA not configured - skipping verification');
      return true;
    }
    
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      console.log('❌ reCAPTCHA verification failed:', data);
      throw new BadRequestException('reCAPTCHA verification failed');
    }

    return true;
  }
}