import { Injectable } from '@nestjs/common';
import { Request } from 'express';

export interface UpstreamRoute {
  name: 'core' | 'notification';
  targetPath: string;
  requiresAuth: boolean;
}

interface PublicRoute {
  method: string;
  pattern: RegExp;
}

const PUBLIC_ROUTES: PublicRoute[] = [
  { method: 'POST', pattern: /^\/auth\/register$/ },
  { method: 'POST', pattern: /^\/auth\/verify-otp$/ },
  { method: 'POST', pattern: /^\/auth\/set-password$/ },
  { method: 'POST', pattern: /^\/auth\/login$/ },
  { method: 'POST', pattern: /^\/cms\/auth\/login$/ },
  { method: 'POST', pattern: /^\/wallet\/deposit\/webhook$/ },
  { method: 'GET', pattern: /^\/stocks$/ },
  { method: 'GET', pattern: /^\/stocks\/[a-f\d]{24}$/i },
  { method: 'GET', pattern: /^\/stocks\/[a-f\d]{24}\/history$/i },
];

@Injectable()
export class RouteResolverService {
  resolve(request: Request): UpstreamRoute {
    const path = this.getPath(request);

    if (path.startsWith('/notifications')) {
      return {
        name: 'notification',
        targetPath: path.replace(/^\/notifications/, '') || '/',
        requiresAuth: true,
      };
    }

    return {
      name: 'core',
      targetPath: path,
      requiresAuth: !this.isPublicRoute(request.method, path),
    };
  }

  private isPublicRoute(method: string, path: string): boolean {
    return PUBLIC_ROUTES.some(
      (route) => route.method === method && route.pattern.test(path),
    );
  }

  private getPath(request: Request): string {
    return request.originalUrl.split('?')[0] || '/';
  }
}
