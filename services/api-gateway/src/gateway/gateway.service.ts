import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response as ExpressResponse } from 'express';
import { Readable } from 'stream';
import { AuthenticatedUser } from '../common/authenticated-user';
import { RateLimitService } from './rate-limit.service';
import { RouteResolverService } from './route-resolver.service';

type RequestBody = string | Record<string, unknown> | unknown[] | undefined;
type RawBodyRequest = Request & { rawBody?: Buffer };

interface JwtPayload extends AuthenticatedUser {
  iat?: number;
  exp?: number;
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly upstreams: Record<'core' | 'notification', string>;
  private readonly proxyTimeoutMs: number;
  private readonly jwtSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly routeResolver: RouteResolverService,
    private readonly rateLimitService: RateLimitService,
  ) {
    this.upstreams = {
      core: this.configService.getOrThrow<string>('upstreams.core'),
      notification: this.configService.getOrThrow<string>(
        'upstreams.notification',
      ),
    };
    this.proxyTimeoutMs =
      this.configService.getOrThrow<number>('proxy.timeoutMs');
    this.jwtSecret = this.configService.getOrThrow<string>('jwt.accessSecret');
  }

  async handle(request: Request, response: ExpressResponse): Promise<void> {
    const startedAt = Date.now();
    const route = this.routeResolver.resolve(request);
    const user = route.requiresAuth
      ? await this.authenticate(request)
      : undefined;

    await this.rateLimitService.consume(request, user);
    this.validateRequest(request);

    const upstreamUrl = this.buildUpstreamUrl(
      this.upstreams[route.name],
      route.targetPath,
      request.originalUrl,
    );
    const upstreamResponse = await this.forward(request, upstreamUrl);

    await this.applyResponse(response, upstreamResponse);
    this.logRequest(
      request,
      route.name,
      upstreamResponse.status,
      Date.now() - startedAt,
      user,
    );
  }

  private async authenticate(request: Request): Promise<AuthenticatedUser> {
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const payload = await this.jwtService
      .verifyAsync<JwtPayload>(token, { secret: this.jwtSecret })
      .catch(() => {
        throw new UnauthorizedException('Invalid bearer token');
      });

    if (!payload.sub || !payload.email || !payload.type) {
      throw new UnauthorizedException('Invalid bearer token');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      type: payload.type,
      role: payload.role,
    };
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      return undefined;
    }

    return header.slice('Bearer '.length);
  }

  private validateRequest(request: Request): void {
    if (request.originalUrl.split('?')[0] === '/wallet/deposit/webhook') {
      return;
    }

    const methodAllowsBody = ['POST', 'PUT', 'PATCH'].includes(request.method);
    const hasBody = request.body !== undefined && request.body !== null;

    if (!methodAllowsBody || !hasBody) {
      return;
    }

    const contentType = request.headers['content-type'];

    if (contentType && !contentType.includes('application/json')) {
      throw new BadRequestException('Only application/json bodies are allowed');
    }

    if (
      typeof request.body !== 'object' ||
      Buffer.isBuffer(request.body) ||
      Array.isArray(request.body)
    ) {
      throw new BadRequestException('Request body must be a JSON object');
    }
  }

  private buildUpstreamUrl(
    upstreamBaseUrl: string,
    targetPath: string,
    originalUrl: string,
  ): URL {
    const query = originalUrl.includes('?')
      ? originalUrl.slice(originalUrl.indexOf('?'))
      : '';

    return new URL(`${targetPath}${query}`, upstreamBaseUrl);
  }

  private async forward(
    request: Request,
    upstreamUrl: URL,
  ): Promise<globalThis.Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.proxyTimeoutMs);

    try {
      return await fetch(upstreamUrl, {
        method: request.method,
        headers: this.buildForwardHeaders(request),
        body: this.buildForwardBody(request),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildForwardHeaders(request: Request): Headers {
    const headers = new Headers();

    for (const [name, value] of Object.entries(request.headers)) {
      if (this.shouldSkipRequestHeader(name) || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((entry) => headers.append(name, entry));
        continue;
      }

      headers.set(name, value);
    }

    headers.set('x-forwarded-for', request.ip ?? '');
    headers.set('x-forwarded-host', request.hostname);
    headers.set('x-forwarded-proto', request.protocol);

    return headers;
  }

  private shouldSkipRequestHeader(name: string): boolean {
    return ['connection', 'content-length', 'expect', 'host'].includes(
      name.toLowerCase(),
    );
  }

  private buildForwardBody(request: Request): BodyInit | undefined {
    if (['GET', 'HEAD'].includes(request.method)) {
      return undefined;
    }

    const rawBody = (request as RawBodyRequest).rawBody;
    if (rawBody) {
      return rawBody as unknown as BodyInit;
    }

    const body = request.body as RequestBody;

    if (body === undefined) {
      return undefined;
    }

    return typeof body === 'string' ? body : JSON.stringify(body);
  }

  private async applyResponse(
    response: ExpressResponse,
    upstreamResponse: globalThis.Response,
  ): Promise<void> {
    response.status(upstreamResponse.status);
    upstreamResponse.headers.forEach((value, name) => {
      if (!this.shouldSkipResponseHeader(name)) {
        response.setHeader(name, value);
      }
    });

    if (
      upstreamResponse.headers
        .get('content-type')
        ?.toLowerCase()
        .includes('text/event-stream')
    ) {
      response.flushHeaders();

      const responseBody = upstreamResponse.body;

      if (!responseBody) {
        response.end();
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const stream = Readable.fromWeb(
          responseBody as unknown as Parameters<typeof Readable.fromWeb>[0],
        );

        stream.on('error', reject);
        response.on('close', resolve);
        response.on('error', reject);
        stream.pipe(response);
      });
      return;
    }

    const body = Buffer.from(await upstreamResponse.arrayBuffer());
    response.send(body);
  }

  private shouldSkipResponseHeader(name: string): boolean {
    return ['connection', 'content-encoding', 'content-length'].includes(
      name.toLowerCase(),
    );
  }

  private logRequest(
    request: Request,
    upstream: string,
    statusCode: number,
    durationMs: number,
    user?: AuthenticatedUser,
  ): void {
    const actor = user ? `${user.type}:${user.sub}` : 'anonymous';

    this.logger.log(
      `${request.method} ${request.originalUrl} -> ${upstream} ${statusCode} ${durationMs}ms actor=${actor}`,
    );
  }
}
