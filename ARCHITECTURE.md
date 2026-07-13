# Rowan Rose Client Portal Backend Architecture

Status: Phase 6.1 foundation

## Chosen Stack

- Runtime: Node.js 20+ with TypeScript.
- HTTP framework: Express for continuity with the existing auth slice and Brad's existing Node.js CRM patterns. Fastify can still replace the HTTP shell later because the business logic is isolated in services.
- Portal persistence: PostgreSQL 15+ with Prisma, using a separate `portal` schema.
- CRM persistence: existing PostgreSQL CRM database, read-only by default through a dedicated CRM data access layer.
- Cache: Redis / AWS ElastiCache for OTP TTLs, session validation cache, rate limiting, MPIN attempt tracking, and short claim-list caching.
- Hosting: EC2 behind an Application Load Balancer, with Nginx on-instance and PM2 cluster mode.
- Secrets: AWS Secrets Manager in staging and production.

## System Diagram

```text
Client web/mobile
  -> CloudFront
  -> Application Load Balancer with ACM TLS 1.2+
  -> EC2 Auto Scaling Group
       -> Nginx reverse proxy
       -> Node.js TypeScript portal API, PM2 cluster
            -> PostgreSQL portal schema via Prisma
            -> Existing CRM PostgreSQL via read-only pool
            -> Redis / ElastiCache
            -> S3 document bucket through pre-signed URLs
            -> Twilio SMS for OTP
            -> CloudWatch logs and metrics
```

## CRM Integration Approach

Recommended approach: Option A, shared PostgreSQL engine with a separate `portal` schema.

The CRM remains the source of truth for clients, claims, statuses, documents, financials, requirements, offers, and messages. The portal schema stores only portal-native concerns: login credentials, MPIN hash, OTP audit trail, sessions, notification preferences, notification logs, and audit logs.

Reasoning:

- Avoids duplicating regulated CRM data.
- Keeps reads fast and consistent with the CRM.
- Lets Phase 7.1 build endpoints without a sync service.
- Keeps portal writes tightly controlled and auditable.

Current caveat: live CRM introspection could not run in this workspace because no `CRM_READONLY_DATABASE_URL` is configured. CRM table names and column mappings stay environment-driven until `CRM_SCHEMA.md` is generated against the production CRM read-only role.

## Request Data Flow

1. Client sends a request with a short-lived JWT access token.
2. `requireAuth` verifies the token and loads the active session.
3. The verified `crmClientId` comes from the token/session, never from client request bodies.
4. CRM service functions query by that `crmClientId`.
5. Hidden internal statuses are filtered in `src/services/crm/statusMapping.ts`.
6. Raw CRM rows are mapped to the frontend's safe response shapes.
7. Cacheable read results, such as claim lists, are stored in Redis with short TTLs.

## Security Boundaries

- Authentication happens in the portal API.
- Passwords, OTPs, MPINs, and refresh tokens are hashed.
- JWT access tokens include `userId`, `crmClientId`, and `sessionId`.
- Every CRM read is scoped by the authenticated `crmClientId`.
- Claim lookups validate ownership and return 404 for missing or other-client claims.
- S3 document URLs must only be generated after CRM ownership validation.
- Hidden CRM statuses never leave the server.
- Secrets are read from environment or AWS Secrets Manager, never hardcoded.

## Scaling Strategy

- PM2 cluster mode uses all EC2 CPU cores.
- ALB plus Auto Scaling Group supports horizontal scaling.
- Redis absorbs OTP, session, rate-limit, MPIN, and hot read traffic.
- Prisma connection limits are capped per instance; use PgBouncer if EC2 count grows.
- Read-heavy CRM endpoints should route to RDS read replicas once available.
- `/health` supports ALB target checks and `/metrics` exposes Prometheus-format process metrics.

## Phase Boundary

Phase 6.1 builds the foundation only. It intentionally does not add claims, documents, messages, financials, or offer API endpoints. Those belong in Phase 7.1 and should consume the services created here.
