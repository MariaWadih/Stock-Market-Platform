# Stock Market Platform

Backend assignment implementation using two NestJS services:

- `services/core-service`: main API on port `3000`
- `services/notification-service`: notification worker/API on port `3001`
- `services/api-gateway`: edge gateway on port `8080`

Local infrastructure expected:

- MongoDB on `localhost:27017`
- Redis on `localhost:6379`
- RabbitMQ on `localhost:5672`
- Gmail account with an app password for transactional email delivery

## Run Locally

Install dependencies for each service:

```bash
cd services/core-service
npm install

cd ../notification-service
npm install
```

Start the core service:

```bash
cd services/core-service
npm run start:dev
```

Start the notification service:

```bash
cd services/notification-service
npm run start:dev
```

Start the API gateway:

```bash
cd services/api-gateway
npm run start:dev
```

## Services

The core service owns authentication, members, CMS users, stocks, wallet, orders, portfolio, analytics, price alerts, Stripe integration, and event publishing.

The notification service consumes RabbitMQ notification events and sends transactional emails.

Notification emails are sent through Gmail SMTP for OTP delivery, wallet credits, trade execution confirmations, price alerts, and CMS account provisioning. Set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `EMAIL_FROM` before running the notification service.

The API gateway verifies JWTs, rate-limits requests, validates JSON request bodies, logs traffic, and forwards requests to the core or notification service.
