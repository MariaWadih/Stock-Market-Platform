import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NOTIFICATION_PORT: Joi.number().port().default(3001),
  RABBITMQ_URL: Joi.string().uri().required(),
  RABBITMQ_NOTIFICATIONS_EXCHANGE: Joi.string().default('notifications'),
  SENDGRID_API_KEY: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),
});
