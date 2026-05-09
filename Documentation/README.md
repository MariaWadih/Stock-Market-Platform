# Documentation

This folder contains the required submission documentation for the Stock Market Platform.

## Contents

- `.env.example`: environment variable template for core service, notification service, and API gateway.
- `database-schemas/core-service-schemas.json`: documented MongoDB collections, fields, and indexes.
- `seed-data/core-service-seed-data.json`: sample data for end-to-end local testing.
- `postman/stock-market-platform.postman_collection.json`: Postman collection with domain folders and saved success/error examples.

## Local Test Order

1. Start MongoDB, Redis, and RabbitMQ.
2. Start `services/core-service`.
3. Start `services/notification-service` when testing notification flows.
4. Start `services/api-gateway`.
5. Import the Postman collection.
6. Set `gatewayBaseUrl` to `http://localhost:8080`.
7. Login as a member or CMS user and paste the access token into `memberAccessToken` or `cmsAccessToken`.

The collection is written against the gateway so requests exercise routing, request validation, rate limiting, and forwarding.

## Notification Testing

The core service publishes RabbitMQ events for OTP delivery, wallet credit confirmations, trade execution confirmations, price alerts, and CMS account provisioning.

The notification service consumes those events from the `notifications` exchange and sends email through Gmail SMTP. A Gmail address with 2-Step Verification enabled and an app password are required. Set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `EMAIL_FROM`.
