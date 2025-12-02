import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email cần gữi lại OTP' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
