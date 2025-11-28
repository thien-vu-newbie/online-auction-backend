// src/auth/auth.service.ts
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RecaptchaService } from '../common/services/recaptcha.service';
import { MailService } from '../common/services/mail.service';

@Injectable()
export class AuthService {
  // Lưu tạm thông tin đăng ký chưa verify 
  private pendingRegistrations = new Map<string, {
    fullName: string;
    email: string;
    password: string;
    otp: string;
    otpExpiry: Date;
  }>();

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private recaptchaService: RecaptchaService,
    private mailService: MailService,
  ) {}

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(registerDto: RegisterDto) {
    // Verify reCAPTCHA
    await this.recaptchaService.verifyRecaptcha(registerDto.recaptchaToken);

    // Check if email already exists and verified in DB
    const existingUser = await this.userModel.findOne({ 
      email: registerDto.email 
    });
    
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Generate OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Lưu tạm vào memory, KHÔNG lưu vào DB
    this.pendingRegistrations.set(registerDto.email, {
      fullName: registerDto.fullName,
      email: registerDto.email,
      password: hashedPassword,
      otp,
      otpExpiry,
    });

    // Send OTP email
    await this.mailService.sendOTP(registerDto.email, otp);

    // Tự động xóa sau 10 phút
    setTimeout(() => {
      this.pendingRegistrations.delete(registerDto.email);
    }, 10 * 60 * 1000);

    return {
      message: 'Registration successful. Please check your email for OTP.',
      email: registerDto.email,
    };
  }

  async verifyOTP(verifyOtpDto: VerifyOtpDto) {
    // Kiểm tra trong pending registrations
    const pendingUser = this.pendingRegistrations.get(verifyOtpDto.email);

    if (!pendingUser) {
      throw new BadRequestException('Registration not found or expired. Please register again.');
    }

    // Verify OTP
    if (pendingUser.otp !== verifyOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    // Check OTP expiry
    if (pendingUser.otpExpiry < new Date()) {
      this.pendingRegistrations.delete(verifyOtpDto.email);
      throw new BadRequestException('OTP has expired. Please register again.');
    }

    // OTP hợp lệ -> Lưu vào DB
    const user = new this.userModel({
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      password: pendingUser.password,
    });

    await user.save();

    // Xóa khỏi pending
    this.pendingRegistrations.delete(verifyOtpDto.email);

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      message: 'Email verified successfully',
      access_token: token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async resendOTP(resendOtpDto: ResendOtpDto) {
    // Kiểm tra trong pending registrations
    const pendingUser = this.pendingRegistrations.get(resendOtpDto.email);

    if (!pendingUser) {
      throw new BadRequestException('Registration not found. Please register again.');
    }

    // Generate new OTP
    const otp = this.generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update OTP trong pending
    pendingUser.otp = otp;
    pendingUser.otpExpiry = otpExpiry;
    this.pendingRegistrations.set(resendOtpDto.email, pendingUser);

    // Send OTP email
    await this.mailService.sendOTP(resendOtpDto.email, otp);

    return {
      message: 'OTP has been resent. Please check your email.',
      email: resendOtpDto.email,
    };
  }

  async login(loginDto: LoginDto) {
    // Verify reCAPTCHA
    await this.recaptchaService.verifyRecaptcha(loginDto.recaptchaToken);

    const user = await this.userModel.findOne({ 
      email: loginDto.email 
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Nếu user đăng ký bằng Google -> không thể login bằng password
    if (user.googleId) {
      throw new UnauthorizedException('This email is registered with Google. Please use Google Sign-In.');
    }

    // Không cần check isEmailVerified vì chỉ user đã verify mới được lưu vào DB

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

    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
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

    const token = this.jwtService.sign({
      sub: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }
}