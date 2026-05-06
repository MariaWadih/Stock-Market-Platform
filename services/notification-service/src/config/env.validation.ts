import { plainToInstance, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class NotificationEnvironmentVariables {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  NOTIFICATION_PORT = 3001;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL!: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_NOTIFICATIONS_EXCHANGE = 'notifications';

  @IsString()
  @IsNotEmpty()
  SENDGRID_API_KEY!: string;

  @IsEmail()
  EMAIL_FROM!: string;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const validatedConfig = plainToInstance(
    NotificationEnvironmentVariables,
    config,
    {
      enableImplicitConversion: true,
      exposeDefaultValues: true,
    },
  );

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig as unknown as Record<string, unknown>;
}
