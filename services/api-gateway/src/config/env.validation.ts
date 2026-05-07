import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class GatewayEnvironmentVariables {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  GATEWAY_PORT = 8080;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1000)
  GATEWAY_RATE_LIMIT_WINDOW_MS = 60000;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  GATEWAY_RATE_LIMIT_MAX_REQUESTS = 120;

  @IsUrl({ require_tld: false })
  @IsOptional()
  CORE_SERVICE_URL = 'http://localhost:3000';

  @IsUrl({ require_tld: false })
  @IsOptional()
  NOTIFICATION_SERVICE_URL = 'http://localhost:3001';

  @Type(() => Number)
  @IsInt()
  @Min(1000)
  GATEWAY_PROXY_TIMEOUT_MS = 30000;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  NODE_ENV?: string;

  @IsString()
  @IsOptional()
  REDIS_HOST = 'localhost';

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  REDIS_PORT = 6379;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const validatedConfig = plainToInstance(GatewayEnvironmentVariables, config, {
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
