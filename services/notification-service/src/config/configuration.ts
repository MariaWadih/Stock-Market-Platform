export default () => ({
  port: parseInt(process.env.NOTIFICATION_PORT ?? '3001', 10),
  rabbitmq: {
    url: process.env.RABBITMQ_URL ?? 'amqp://localhost:5672',
    notificationsExchange:
      process.env.RABBITMQ_NOTIFICATIONS_EXCHANGE ?? 'notifications',
  },
  email: {
    gmailUser: process.env.GMAIL_USER,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
});
