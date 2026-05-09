# API Gateway

NestJS edge service for the Stock Market Platform.

Responsibilities:

- verifies JWT access tokens before protected routes reach upstream services
- applies per-IP and per-user in-memory rate limiting
- routes `/notifications/*` requests to the notification service
- routes all other requests to the core service
- validates forwarded JSON request bodies
- logs every forwarded request with upstream, status, duration, and actor

Default local port: `8080`.

Required environment variables:

- `JWT_ACCESS_SECRET`

Optional environment variables:

- `GATEWAY_PORT`
- `CORE_SERVICE_URL`
- `NOTIFICATION_SERVICE_URL`
- `GATEWAY_RATE_LIMIT_WINDOW_MS`
- `GATEWAY_RATE_LIMIT_MAX_REQUESTS`
- `GATEWAY_PROXY_TIMEOUT_MS`
