import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import { NotificationEvent, NotificationEventType } from './notification-event';

interface EmailContent {
  to: string;
  subject: string;
  text: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly from: string;

  constructor(configService: ConfigService) {
    sgMail.setApiKey(configService.getOrThrow<string>('email.sendgridApiKey'));
    this.from = configService.getOrThrow<string>('email.from');
  }

  async sendNotification(event: NotificationEvent): Promise<void> {
    const content = this.render(event);

    await sgMail.send({
      from: this.from,
      ...content,
    });
  }

  private render(event: NotificationEvent): EmailContent {
    switch (event.type) {
      case NotificationEventType.OtpCreated:
        return {
          to: event.payload.email,
          subject: 'Your stock platform verification code',
          text: `Your OTP is ${event.payload.code}. It expires in ${event.payload.expiresInMinutes} minutes.`,
          html: `<p>Your OTP is <strong>${event.payload.code}</strong>.</p><p>It expires in ${event.payload.expiresInMinutes} minutes.</p>`,
        };

      case NotificationEventType.WalletCredited:
        return {
          to: event.payload.email,
          subject: 'Wallet deposit confirmed',
          text: `Hello ${event.payload.fullName}, your wallet was credited with $${event.payload.amount}. Current balance: $${event.payload.balance}.`,
          html: `<p>Hello ${event.payload.fullName},</p><p>Your wallet was credited with <strong>$${event.payload.amount}</strong>.</p><p>Current balance: <strong>$${event.payload.balance}</strong>.</p>`,
        };

      case NotificationEventType.TradeExecuted:
        return {
          to: event.payload.email,
          subject: `${event.payload.side.toUpperCase()} order executed`,
          text: `Hello ${event.payload.fullName}, your ${event.payload.side} order for ${event.payload.quantity} ${event.payload.ticker} shares executed at $${event.payload.price}. Total value: $${event.payload.totalValue}.`,
          html: `<p>Hello ${event.payload.fullName},</p><p>Your <strong>${event.payload.side}</strong> order for <strong>${event.payload.quantity} ${event.payload.ticker}</strong> shares executed at <strong>$${event.payload.price}</strong>.</p><p>Total value: <strong>$${event.payload.totalValue}</strong>.</p>`,
        };

      case NotificationEventType.PriceAlertTriggered:
        return {
          to: event.payload.email,
          subject: `${event.payload.ticker} price alert triggered`,
          text: `Hello ${event.payload.fullName}, ${event.payload.ticker} crossed your $${event.payload.thresholdPrice} alert. Current price: $${event.payload.currentPrice}.`,
          html: `<p>Hello ${event.payload.fullName},</p><p><strong>${event.payload.ticker}</strong> crossed your <strong>$${event.payload.thresholdPrice}</strong> alert.</p><p>Current price: <strong>$${event.payload.currentPrice}</strong>.</p>`,
        };

      case NotificationEventType.CmsUserProvisioned:
        return {
          to: event.payload.email,
          subject: 'Your CMS account has been created',
          text: `Hello ${event.payload.fullName}, your CMS ${event.payload.role} account has been created. Temporary password: ${event.payload.temporaryPassword}`,
          html: `<p>Hello ${event.payload.fullName},</p><p>Your CMS <strong>${event.payload.role}</strong> account has been created.</p><p>Temporary password: <strong>${event.payload.temporaryPassword}</strong></p>`,
        };
    }
  }
}
