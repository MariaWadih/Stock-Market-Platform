import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthenticatedUser } from '../common/authenticated-user';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(configService: ConfigService) {
    this.windowMs = configService.getOrThrow<number>('rateLimit.windowMs');
    this.maxRequests = configService.getOrThrow<number>(
      'rateLimit.maxRequests',
    );
  }

  consume(request: Request, user?: AuthenticatedUser): void {
    const now = Date.now();
    const key = this.getKey(request, user);
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      this.pruneExpired(now);
      return;
    }

    bucket.count += 1;

    if (bucket.count > this.maxRequests) {
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

  private pruneExpired(now: number): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
