import { plainToInstance, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class CoreEnvironmentVariables {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  CORE_PORT = 3000;

  @IsString()
  @IsNotEmpty()
  MONGODB_URI!: string;

  @IsString()
  @IsNotEmpty()
  REDIS_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  REDIS_PORT = 6379;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  REDIS_TTL_SECONDS = 300;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL!: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_NOTIFICATIONS_EXCHANGE = 'notifications';

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_ACCESS_EXPIRES_IN = '15m';

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  JWT_REFRESH_EXPIRES_IN = '7d';

  @IsEmail()
  @IsOptional()
  CMS_ADMIN_EMAIL?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  CMS_ADMIN_PASSWORD?: string;

  @IsString()
  @IsOptional()
  CMS_ADMIN_FULL_NAME?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_THROTTLE_TTL_MS = 60000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  AUTH_THROTTLE_LIMIT = 10;

  @IsString()
  @IsOptional()
  SENDGRID_API_KEY?: string;

  @IsEmail()
  @IsOptional()
  EMAIL_FROM?: string;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY?: string;

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET?: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const validatedConfig = plainToInstance(CoreEnvironmentVariables, config, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig as unknown as Record<string, unknown>;
}
