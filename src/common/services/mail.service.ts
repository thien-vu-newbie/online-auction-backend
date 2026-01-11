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

  async sendPasswordReset(email: string, fullName: string, tempPassword: string) {
    if (!this.transporter) {
      console.log(`⚠️  Email not configured - Temporary password for ${email} is: ${tempPassword}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: email,
      subject: 'Your Password Has Been Reset - Online Auction',
      html: `
        <h2>Password Reset by Admin</h2>
        <p>Hello ${fullName},</p>
        <p>Your password has been reset by an administrator.</p>
        <p>Your new temporary password is: <strong>${tempPassword}</strong></p>
        <p style="color: #e74c3c;"><strong>⚠️ Please change this password immediately after logging in.</strong></p>
        <p>If you did not expect this, please contact support immediately.</p>
      `,
    });
  }

  // ============= AUCTION EMAIL NOTIFICATIONS =============

  async sendBidPlacedToSeller(data: {
    sellerEmail: string;
    sellerName: string;
    productName: string;
    bidderName: string;
    bidAmount: number;
    currentPrice: number;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Bid Placed - Seller] ${data.sellerEmail}: Product "${data.productName}" - New bid ${data.bidAmount} by ${data.bidderName}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.sellerEmail,
      subject: `New Bid on Your Product: ${data.productName}`,
      html: `
        <h2>New Bid Placed!</h2>
        <p>Hello ${data.sellerName},</p>
        <p>Good news! Someone just placed a bid on your product.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Bidder:</strong> ${data.bidderName}<br>
          <strong>Bid Amount:</strong> ${data.bidAmount.toLocaleString()} VND<br>
          <strong>Current Price:</strong> ${data.currentPrice.toLocaleString()} VND
        </div>

        <p>Thank you for using our auction platform!</p>
      `,
    });
  }

  async sendBidPlacedToBidder(data: {
    bidderEmail: string;
    bidderName: string;
    productName: string;
    bidAmount: number;
    currentPrice: number;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Bid Placed - Bidder] ${data.bidderEmail}: Bid ${data.bidAmount} on "${data.productName}"`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.bidderEmail,
      subject: `Bid Confirmation: ${data.productName}`,
      html: `
        <h2>Bid Placed Successfully!</h2>
        <p>Hello ${data.bidderName},</p>
        <p>Your bid has been placed successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Your Bid:</strong> ${data.bidAmount.toLocaleString()} VND<br>
          <strong>Current Price:</strong> ${data.currentPrice.toLocaleString()} VND
        </div>

        <p>Good luck with your bid!</p>
      `,
    });
  }

  async sendOutbidNotification(data: {
    previousBidderEmail: string;
    previousBidderName: string;
    productName: string;
    productId: string;
    previousBidAmount: number;
    newBidAmount: number;
    currentPrice: number;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Outbid] ${data.previousBidderEmail}: Outbid on "${data.productName}" - Was ${data.previousBidAmount}, now ${data.newBidAmount}`);
      return;
    }

    const productUrl = `${this.configService.get('FRONTEND_URL')}/product/${data.productId}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.previousBidderEmail,
      subject: `You've Been Outbid: ${data.productName}`,
      html: `
        <h2>You've Been Outbid!</h2>
        <p>Hello ${data.previousBidderName},</p>
        <p>Unfortunately, someone has placed a higher bid on the product you were winning.</p>
        
        <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Your Previous Bid:</strong> ${data.previousBidAmount.toLocaleString()} VND<br>
          <strong>New Bid:</strong> ${data.newBidAmount.toLocaleString()} VND<br>
          <strong>Current Price:</strong> ${data.currentPrice.toLocaleString()} VND
        </div>

        <p><a href="${productUrl}" style="background-color: #ffc107; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Place Higher Bid Now</a></p>

        <p>If you're still interested, you can place a higher bid to stay in the game!</p>
      `,
    });
  }

  async sendBidderRejected(data: {
    bidderEmail: string;
    bidderName: string;
    productName: string;
    sellerName: string;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Bidder Rejected] ${data.bidderEmail}: Rejected from "${data.productName}" by ${data.sellerName}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.bidderEmail,
      subject: `Bidding Rejected: ${data.productName}`,
      html: `
        <h2>Bidding Not Allowed</h2>
        <p>Hello ${data.bidderName},</p>
        <p>We regret to inform you that the seller has rejected your participation in this auction.</p>
        
        <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Seller:</strong> ${data.sellerName}
        </div>

        <p>You can no longer place bids on this product. Please explore other available auctions.</p>
      `,
    });
  }

  async sendAuctionEndedNoBidder(data: {
    sellerEmail: string;
    sellerName: string;
    productName: string;
    startPrice: number;
    endTime: Date;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Auction Ended - No Bidder] ${data.sellerEmail}: "${data.productName}" ended with no bids`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.sellerEmail,
      subject: `Auction Ended Without Bids: ${data.productName}`,
      html: `
        <h2>Auction Ended</h2>
        <p>Hello ${data.sellerName},</p>
        <p>Your auction has ended, but unfortunately no one placed a bid.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Start Price:</strong> ${data.startPrice.toLocaleString()} VND<br>
          <strong>Ended At:</strong> ${data.endTime.toLocaleString('vi-VN')}
        </div>

        <p>You may consider relisting this product with adjusted pricing or better description.</p>
      `,
    });
  }

  async sendAuctionEndedToSeller(data: {
    sellerEmail: string;
    sellerName: string;
    productName: string;
    finalPrice: number;
    winnerName: string;
    winnerEmail: string;
    endTime: Date;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Auction Ended - Seller] ${data.sellerEmail}: "${data.productName}" sold for ${data.finalPrice} to ${data.winnerName}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.sellerEmail,
      subject: `Auction Ended - Product Sold: ${data.productName}`,
      html: `
        <h2>Congratulations! Your Product Has Been Sold!</h2>
        <p>Hello ${data.sellerName},</p>
        <p>Great news! Your auction has ended successfully with a winning bidder.</p>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Final Price:</strong> ${data.finalPrice.toLocaleString()} VND<br>
          <strong>Winner:</strong> ${data.winnerName}<br>
          <strong>Winner Email:</strong> ${data.winnerEmail}<br>
          <strong>Ended At:</strong> ${data.endTime.toLocaleString('vi-VN')}
        </div>

        <p>Please contact the buyer to arrange payment and delivery.</p>
        <p>Thank you for using our auction platform!</p>
      `,
    });
  }

  async sendAuctionEndedToWinner(data: {
    winnerEmail: string;
    winnerName: string;
    productName: string;
    finalPrice: number;
    sellerName: string;
    sellerEmail: string;
    endTime: Date;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Auction Ended - Winner] ${data.winnerEmail}: Won "${data.productName}" for ${data.finalPrice}`);
      return;
    }

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.winnerEmail,
      subject: `Congratulations! You Won: ${data.productName}`,
      html: `
        <h2>Congratulations! You Won the Auction!</h2>
        <p>Hello ${data.winnerName},</p>
        <p>You are the winning bidder for this auction!</p>
        
        <div style="background-color: #d4edda; padding: 15px; margin: 20px 0; border-left: 4px solid #28a745;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Final Price:</strong> ${data.finalPrice.toLocaleString()} VND<br>
          <strong>Seller:</strong> ${data.sellerName}<br>
          <strong>Seller Email:</strong> ${data.sellerEmail}<br>
          <strong>Ended At:</strong> ${data.endTime.toLocaleString('vi-VN')}
        </div>

        <p>Please contact the seller to arrange payment and delivery details.</p>
        <p>Thank you for using our auction platform!</p>
      `,
    });
  }

  async sendNewQuestionToSeller(data: {
    sellerEmail: string;
    sellerName: string;
    productName: string;
    productId: string;
    commenterName: string;
    question: string;
  }) {
    if (!this.transporter) {
      console.log(`⚠️  Email not configured - New question notification for ${data.sellerEmail}`);
      return;
    }

    const productUrl = `${this.configService.get('FRONTEND_URL')}/products/${data.productId}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.sellerEmail,
      subject: `New Question About Your Product: ${data.productName}`,
      html: `
        <h2>New Question About Your Product</h2>
        <p>Hello <strong>${data.sellerName}</strong>,</p>
        
        <p><strong>${data.commenterName}</strong> has asked a question about your product:</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Question:</strong><br>
          <p style="margin-top: 10px;">${data.question}</p>
        </div>

        <p><a href="${productUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Product & Reply</a></p>
        
        <p>Please reply to help potential bidders understand your product better.</p>
        <p>Thank you for using our auction platform!</p>
      `,
    });
  }

  async sendNewReplyNotification(data: {
    recipientEmail: string;
    productName: string;
    productId: string;
    commenterName: string;
    replyContent: string;
  }) {
    if (!this.transporter) {
      console.log(`⚠️  Email not configured - New reply notification for ${data.recipientEmail}`);
      return;
    }

    const productUrl = `${this.configService.get('FRONTEND_URL')}/products/${data.productId}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.recipientEmail,
      subject: `New Reply on: ${data.productName}`,
      html: `
        <h2>New Reply on Product Discussion</h2>
        
        <p><strong>${data.commenterName}</strong> has replied to a discussion on:</p>

        <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #4CAF50; margin: 20px 0;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Reply:</strong><br>
          <p style="margin-top: 10px;">${data.replyContent}</p>
        </div>

        <p><a href="${productUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Discussion</a></p>
        
        <p>Thank you for using our auction platform!</p>
      `,
    });
  }

  async sendDescriptionAddedToBidders(data: {
    bidderEmail: string;
    bidderName: string;
    productName: string;
    productId: string;
    sellerName: string;
    addedContent: string;
  }) {
    if (!this.transporter) {
      console.log(`📧 [Description Added] ${data.bidderEmail}: Description updated on "${data.productName}"`);
      return;
    }

    const productUrl = `${this.configService.get('FRONTEND_URL')}/product/${data.productId}`;

    await this.transporter.sendMail({
      from: this.configService.get('MAIL_FROM'),
      to: data.bidderEmail,
      subject: `Product Description Updated: ${data.productName}`,
      html: `
        <h2>Product Description Updated</h2>
        <p>Hello ${data.bidderName},</p>
        <p>The seller has added more information to a product you're bidding on.</p>
        
        <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
          <strong>Product:</strong> ${data.productName}<br>
          <strong>Seller:</strong> ${data.sellerName}<br><br>
          <strong>New Information:</strong><br>
          <p style="margin-top: 10px; white-space: pre-line;">${data.addedContent}</p>
        </div>

        <p><a href="${productUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Product Details</a></p>
        
        <p>Stay informed about the products you're interested in!</p>
        <p>Thank you for using our auction platform!</p>
      `,
    });
  }
}