import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  CORE_PORT: Joi.number().port().default(3000),
  MONGODB_URI: Joi.string().uri().required(),
  REDIS_HOST: Joi.string().hostname().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_TTL_SECONDS: Joi.number().integer().positive().default(300),
  RABBITMQ_URL: Joi.string().uri().required(),
  RABBITMQ_NOTIFICATIONS_EXCHANGE: Joi.string().default('notifications'),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CMS_ADMIN_EMAIL: Joi.string().email().optional(),
  CMS_ADMIN_PASSWORD: Joi.string().min(8).optional(),
  CMS_ADMIN_FULL_NAME: Joi.string().optional(),
  AUTH_THROTTLE_TTL_MS: Joi.number().integer().positive().default(60000),
  AUTH_THROTTLE_LIMIT: Joi.number().integer().positive().default(10),
  SENDGRID_API_KEY: Joi.string().optional(),
  EMAIL_FROM: Joi.string().email().optional(),
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
});
