import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(apiKey, {
      apiVersion: '2025-12-15.clover',
    });
  }

  /**
   * Tạo Payment Intent cho buyer thanh toán
   * @param amount - Số tiền (VND)
   * @param metadata - Thông tin đơn hàng
   * @returns Payment Intent với client_secret
   */
  async createPaymentIntent(amount: number, metadata: any): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount), // Stripe yêu cầu integer (đơn vị nhỏ nhất)
      currency: 'vnd',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never', // Chỉ chấp nhận card payment, không dùng redirect methods
      },
      metadata,
    });

    return paymentIntent;
  }

  /**
   * Lấy thông tin Payment Intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Hoàn tiền (refund) khi seller cancel transaction
   */
  async refundPayment(paymentIntentId: string, reason?: string): Promise<Stripe.Refund> {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer',
      metadata: {
        cancelReason: reason || 'Seller cancelled transaction',
      },
    });

    return refund;
  }

  /**
   * Get Stripe account ID (for building dashboard URLs)
   */
  async getAccountId(): Promise<string> {
    const account = await this.stripe.accounts.retrieve();
    return account.id;
  }
}
