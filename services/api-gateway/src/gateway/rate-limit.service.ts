import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Redis } from 'ioredis';
import { AuthenticatedUser } from '../common/authenticated-user';

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(configService: ConfigService) {
    this.windowMs = configService.getOrThrow<number>('rateLimit.windowMs');
    this.maxRequests = configService.getOrThrow<number>(
      'rateLimit.maxRequests',
    );

    this.redis = new Redis({
      host: configService.getOrThrow<string>('redis.host'),
      port: configService.getOrThrow<number>('redis.port'),
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }

  async consume(request: Request, user?: AuthenticatedUser): Promise<void> {
    const now = Date.now();
    const key = `ratelimit:${this.getKey(request, user)}`;
    const windowStart = now - this.windowMs;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, now.toString());
    pipeline.pexpire(key, this.windowMs);

    const results = await pipeline.exec();
    if (!results) {
      return;
    }

    const count = results[1][1] as number;

    if (count >= this.maxRequests) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private getKey(request: Request, user?: AuthenticatedUser): string {
    if (user) {
      return `user:${user.type}:${user.sub}`;
    }

    return `ip:${request.ip ?? request.socket.remoteAddress ?? 'unknown'}`;
  }
}
