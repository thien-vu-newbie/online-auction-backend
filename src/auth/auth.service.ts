import { Injectable, BadRequestException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from '../users/dto/change-password.dto';
import { RecaptchaService } from '../common/services/recaptcha.service';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private recaptchaService: RecaptchaService,
    private mailService: MailService,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d', // Access token expires in 1 day
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        expiresIn: '7d', // Refresh token expires in 7 days
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async register(registerDto: RegisterDto) {
    // Verify reCAPTCHA
    await this.recaptchaService.verifyRecaptcha(registerDto.recaptchaToken);

    // Check if email already exists in DB
    const existingUser = await this.userModel.findOne({ 
      email: registerDto.email 
    });
    
    if (existingUser && existingUser.isEmailVerified) {
      throw new BadRequestException('Email already registered and verified');
    }

    if (existingUser && !existingUser.isEmailVerified) {
      // User đã đăng ký nhưng chưa verify -> update OTP mới
      const otp = this.generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      existingUser.emailVerificationOtp = otp;
      existingUser.emailVerificationOtpExpiry = otpExpiry;
      await existingUser.save();

      await this.mailService.sendOTP(registerDto.email, otp);

      return {
        message: 'Email already registered but not verified. New OTP has been sent.',
        email: registerDto.email,
      };
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Lưu vào DB ngay với isEmailVerified = false
    const newUser = new this.userModel({
      fullName: registerDto.fullName,
      email: registerDto.email,
      password: hashedPassword,
      address: registerDto.address,
      dateOfBirth: registerDto.dateOfBirth ? new Date(registerDto.dateOfBirth) : undefined,
      isEmailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationOtpExpiry: otpExpiry,
    });

    await newUser.save();

    // Send OTP email
    await this.mailService.sendOTP(registerDto.email, otp);

    return {
      message: 'Registration successful. Please check your email for OTP.',
      email: registerDto.email,
    };
  }

  async verifyOTP(verifyOtpDto: VerifyOtpDto) {
    // Tìm user trong DB
    const user = await this.userModel.findOne({ 
      email: verifyOtpDto.email 
    });

    if (!user) {
      throw new BadRequestException('User not found. Please register first.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified. Please login.');
    }

    // Verify OTP
    if (user.emailVerificationOtp !== verifyOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check OTP expiry
    if (user.emailVerificationOtpExpiry && user.emailVerificationOtpExpiry < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    // OTP hợp lệ -> Cập nhật isEmailVerified và xóa OTP
    user.isEmailVerified = true;
    user.emailVerificationOtp = undefined;
    user.emailVerificationOtpExpiry = undefined;
    await user.save();

    // Generate access token and refresh token
    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Save hashed refresh token to database
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      message: 'Email verified successfully',
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async resendOTP(resendOtpDto: ResendOtpDto) {
    // Tìm user chưa verify trong DB
    const user = await this.userModel.findOne({ 
      email: resendOtpDto.email 
    });

    if (!user) {
      throw new BadRequestException('User not found. Please register first.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified. Please login.');
    }

    // Generate new OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update OTP trong DB
    user.emailVerificationOtp = otp;
    user.emailVerificationOtpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await this.mailService.sendOTP(resendOtpDto.email, otp);

    return {
      message: 'OTP has been resent. Please check your email.',
      email: resendOtpDto.email,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ 
      email: loginDto.email 
    });

    if (!user) {
      throw new UnauthorizedException('This email is not registered.');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email first. Check your inbox for OTP.');
    }

    // Nếu user đăng ký bằng Google -> không thể login bằng password
    if (user.googleId) {
      throw new UnauthorizedException('This email is registered with Google. Please use Google Sign-In.');
    }

    // Fix: Thêm check password undefined
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password, 
      user.password
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate access token and refresh token
    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Save hashed refresh token to database
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new BadRequestException('No user from Google');
    }

    const { email, firstName, lastName, googleId } = req.user;

    let user = await this.userModel.findOne({ email });

    if (!user) {
      // Create new user with Google
      user = new this.userModel({
        fullName: `${firstName} ${lastName}`,
        email,
        googleId,
      });
      await user.save();
    } else if (!user.googleId) {
      throw new BadRequestException('Email already registered with email/password. Please use regular login.');
    }

    // Generate access token and refresh token
    const tokens = await this.generateTokens(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Save hashed refresh token to database
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userModel.findOne({ 
      email: forgotPasswordDto.email 
    });

    if (!user) {
      throw new BadRequestException('Email not found');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Please verify your email first.');
    }

    // Nếu user đăng ký bằng Google -> không có password để reset
    if (user.googleId && !user.password) {
      throw new BadRequestException('This account uses Google Sign-In and has no password to reset');
    }

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Lưu OTP vào DB
    user.passwordResetOtp = otp;
    user.passwordResetOtpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    await this.mailService.sendPasswordResetOTP(forgotPasswordDto.email, otp);

    return {
      message: 'Password reset OTP has been sent to your email',
      email: forgotPasswordDto.email,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    // Tìm user trong DB
    const user = await this.userModel.findOne({ 
      email: resetPasswordDto.email 
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.passwordResetOtp) {
      throw new BadRequestException('Password reset request not found. Please request a new one.');
    }

    // Verify OTP
    if (user.passwordResetOtp !== resetPasswordDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check OTP expiry
    if (user.passwordResetOtpExpiry && user.passwordResetOtpExpiry < new Date()) {
      throw new BadRequestException('OTP has expired. Please request a new one');
    }

    // Hash password mới
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Cập nhật password và xóa OTP
    user.password = hashedPassword;
    user.passwordResetOtp = undefined;
    user.passwordResetOtpExpiry = undefined;
    await user.save();

    return {
      message: 'Password has been reset successfully',
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(
        refreshTokenDto.refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        },
      );

      // Find user
      const user = await this.userModel.findById(payload.sub);
      
      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Access Denied');
      }

      // Check if user is still verified and active
      if (!user.isEmailVerified) {
        throw new ForbiddenException('Email not verified. Please verify your email.');
      }

      // Verify stored refresh token matches
      const refreshTokenMatches = await bcrypt.compare(
        refreshTokenDto.refreshToken,
        user.refreshToken,
      );

      if (!refreshTokenMatches) {
        throw new ForbiddenException('Access Denied');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(
        user._id.toString(),
        user.email,
        user.role,
      );

      // Update refresh token in database
      await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    // Remove refresh token from database
    await this.userModel.findByIdAndUpdate(userId, {
      refreshToken: null,
    });

    return {
      message: 'Logged out successfully',
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Nếu user đăng ký bằng Google -> không có password để đổi
    if (user.googleId && !user.password) {
      throw new BadRequestException('This account uses Google Sign-In and has no password');
    }

    if (!user.password) {
      throw new BadRequestException('No password set for this account');
    }

    // Verify old password
    const isOldPasswordValid = await bcrypt.compare(
      changePasswordDto.oldPassword,
      user.password,
    );

    if (!isOldPasswordValid) {
      throw new BadRequestException('Old password is incorrect');
    }

    // Check if new password is different from old password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.password,
    );

    if (isSamePassword) {
      throw new BadRequestException('New password must be different from old password');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }
}