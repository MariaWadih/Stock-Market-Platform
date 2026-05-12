export default () => ({
  port: parseInt(process.env.CORE_PORT ?? '3000', 10),
  database: {
    uri:
      process.env.MONGODB_URI ??
      'mongodb://localhost:27017/stock_market_platform',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    ttlSeconds: parseInt(process.env.REDIS_TTL_SECONDS ?? '300', 10),
  },
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    notificationsExchange:
      process.env.RABBITMQ_NOTIFICATIONS_EXCHANGE ?? 'notifications',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  cms: {
    adminEmail: process.env.CMS_ADMIN_EMAIL,
    adminPassword: process.env.CMS_ADMIN_PASSWORD,
    adminFullName: process.env.CMS_ADMIN_FULL_NAME,
  },
  throttling: {
    ttl: parseInt(process.env.AUTH_THROTTLE_TTL_MS ?? '60000', 10),
    limit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
  },
  auth: {
    otpTtlMinutes: parseInt(process.env.OTP_TTL_MINUTES ?? '10', 10),
  },
  withdrawals: {
    holdingPeriodHours: parseInt(
      process.env.WITHDRAWAL_HOLDING_PERIOD_HOURS ?? '48',
      10,
    ),
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    successUrl:
      process.env.STRIPE_SUCCESS_URL ?? 'http://localhost:8080/wallet',
    cancelUrl: process.env.STRIPE_CANCEL_URL ?? 'http://localhost:8080/wallet',
  },
});
