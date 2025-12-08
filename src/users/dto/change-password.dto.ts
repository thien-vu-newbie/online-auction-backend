import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ 
    description: 'Mật khẩu cũ', 
    example: 'OldPassword123!' 
  })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({ 
    description: 'Mật khẩu mới', 
    example: 'NewPassword123!' 
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
