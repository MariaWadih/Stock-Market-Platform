export default () => ({
  port: parseInt(process.env.GATEWAY_PORT ?? '8080', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
  },
  rateLimit: {
    windowMs: parseInt(process.env.GATEWAY_RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    maxRequests: parseInt(
      process.env.GATEWAY_RATE_LIMIT_MAX_REQUESTS ?? '120',
      10,
    ),
  },
  upstreams: {
    core: process.env.CORE_SERVICE_URL ?? 'http://localhost:3000',
    notification:
      process.env.NOTIFICATION_SERVICE_URL ?? 'http://localhost:3001',
  },
  proxy: {
    timeoutMs: parseInt(process.env.GATEWAY_PROXY_TIMEOUT_MS ?? '30000', 10),
  },
});
