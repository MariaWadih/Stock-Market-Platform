export enum NotificationEventType {
  OtpCreated = 'auth.otp.created',
  WalletCredited = 'wallet.credited',
  TradeExecuted = 'trade.executed',
  PriceAlertTriggered = 'price_alert.triggered',
  CmsUserProvisioned = 'cms_user.provisioned',
}

interface BaseNotificationEvent<T extends NotificationEventType, P> {
  type: T;
  payload: P;
  occurredAt: string;
}

export type NotificationEvent =
  | BaseNotificationEvent<
      NotificationEventType.OtpCreated,
      {
        email: string;
        code: string;
        expiresInMinutes: number;
      }
    >
  | BaseNotificationEvent<
      NotificationEventType.WalletCredited,
      {
        email: string;
        fullName: string;
        amount: number;
        balance: number;
      }
    >
  | BaseNotificationEvent<
      NotificationEventType.TradeExecuted,
      {
        email: string;
        fullName: string;
        side: 'buy' | 'sell';
        ticker: string;
        quantity: number;
        price: number;
        totalValue: number;
        realizedProfitLoss?: number;
      }
    >
  | BaseNotificationEvent<
      NotificationEventType.PriceAlertTriggered,
      {
        email: string;
        fullName: string;
        ticker: string;
        thresholdPrice: number;
        currentPrice: number;
      }
    >
  | BaseNotificationEvent<
      NotificationEventType.CmsUserProvisioned,
      {
        email: string;
        fullName: string;
        role: string;
        temporaryPassword: string;
      }
    >;
