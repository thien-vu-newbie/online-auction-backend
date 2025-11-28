import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RecaptchaService {
  constructor(private configService: ConfigService) {}

  async verifyRecaptcha(token: string): Promise<boolean> {
    const secretKey = this.configService.get<string>('RECAPTCHA_SECRET_KEY');
    // Kiểm tra nếu không có secret key
    if (!secretKey || secretKey === '6LeMExssAAAAAOOVpjNnKpiH1o3-dYImaj7ozFF4') {
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