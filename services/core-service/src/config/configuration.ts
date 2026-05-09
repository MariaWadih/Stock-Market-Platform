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
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});
