---
phase: 6.1
area: Backend
title: Backend Architecture, Tech Stack & CRM Integration Foundation
status: in-progress
depends_on: frontend signoff
---

# Rowan Rose Client Portal — Phase 6.1: Backend Architecture, Tech Stack & CRM Integration Foundation

<context>
The web app frontend is complete (Phases 1.1 through 5.1), running entirely on mock data. The in-app notification feed has been handled separately by the client team.

This is Phase 6.1 — the backend foundation. Before building any feature endpoints, you must establish the complete backend architecture: tech stack, database schema, CRM connection strategy, authentication infrastructure (OTP + MPIN), caching, data backup, and hosting setup on AWS EC2.

EXISTING SYSTEM:
- The firm runs an existing CRM built on Node.js + PostgreSQL
- The CRM holds all client records, claim records, statuses, documents metadata, and financial data
- The portal must read from and write to the CRM data so information flows back and forth
- Expected scale: 10,000+ clients, each with 3–5 concurrent claims

PERFORMANCE & RELIABILITY GOALS (non-negotiable):
- Bank-app / YouTube-level responsiveness — no lag, fast page loads, instant interactions
- Each client sees ONLY their own account, claims, and updates (strict per-account data isolation)
- Login like a banking app: phone number → OTP, plus a 6-digit MPIN for fast repeat access
- Peak optimisation: efficient queries, caching, connection pooling
- Robust database persistence with automated backups and point-in-time recovery
- Crucial data preserved so any future change or incident still leaves a recoverable backup

HOSTING:
- AWS EC2 instance for the application hosting
- Supporting AWS services for database, storage, caching, and backups
</context>

<recommended_tech_stack>

## Backend Framework
- **Node.js (LTS, v20+)** with **TypeScript** — matches the existing CRM, type safety reduces runtime errors at scale
- **Express.js** or **Fastify** — Fastify recommended for 10,000+ clients due to significantly higher throughput and lower overhead. If the team prefers familiarity with the existing CRM, Express is acceptable.
- **Why:** Sharing the language and runtime with the existing CRM means shared types, shared utilities, and easier maintenance.

## Database
- **PostgreSQL 15+** — matches the existing CRM. Use the SAME database engine to simplify integration.
- Two architectural options for the portal data (decide based on CRM access — see CRM Integration section):
  - **Option A (Recommended): Shared database, separate schema.** The portal connects to the existing CRM PostgreSQL database but uses its own schema (e.g. `portal`) for portal-specific tables (sessions, MPINs, notification logs, audit logs). It reads CRM data from the existing `crm` schema via views or direct table access (read-only where appropriate).
  - **Option B: Separate portal database with sync.** The portal has its own PostgreSQL database and syncs with the CRM via API or scheduled jobs. More isolation but adds sync complexity and potential data staleness.
- **ORM: Prisma** — type-safe, excellent PostgreSQL support, auto-generated TypeScript types, migration management. Alternative: Drizzle ORM (lighter, SQL-first).

## Caching
- **Redis (AWS ElastiCache)** — critical for bank-app speed at 10,000+ clients
  - Cache session data and MPIN verification state
  - Cache frequently accessed read-only data (claim lists, status mappings)
  - Store OTP codes with TTL (auto-expiry)
  - Rate limiting counters
  - Reduces database load dramatically

## Authentication & Security
- **JWT (JSON Web Tokens)** for session tokens — short-lived access tokens (15 min) + longer refresh tokens (7 days)
- **bcrypt** for password hashing (minimum 12 rounds, per the original spec)
- **OTP via Twilio** (the spec mentions Twilio via Zapier — recommend direct Twilio SDK integration for reliability over Zapier)
- **MPIN** — 6-digit PIN, hashed with bcrypt, stored separately from passwords, used for fast re-authentication
- **Helmet.js** for security headers
- **express-rate-limit** + Redis for distributed rate limiting

## File Storage
- **AWS S3** — for client document uploads (per the original spec)
- **CloudFront CDN** in front of S3 for fast document retrieval
- Pre-signed URLs for secure, time-limited document access

## Hosting & Infrastructure (AWS)
- **EC2** — application server(s). Recommend t3.large or m5.large to start, with auto-scaling group for traffic spikes
- **Application Load Balancer (ALB)** — distributes traffic across EC2 instances, enables horizontal scaling
- **RDS for PostgreSQL** — if migrating the CRM database to managed RDS, OR keep the existing CRM database and connect to it. RDS provides automated backups, Multi-AZ failover, and read replicas
- **ElastiCache (Redis)** — managed Redis for caching
- **S3** — document storage + backup storage
- **CloudWatch** — monitoring, logging, alerts
- **Secrets Manager** — store database credentials, API keys, JWT secrets

## Process Management
- **PM2** — Node.js process manager on EC2 (clustering, auto-restart, zero-downtime reloads)
- OR containerise with **Docker** + **ECS** for easier scaling (the client has Docker experience based on their infrastructure background)

</recommended_tech_stack>

<tasks>

## Task 1: Architecture Decision Document

Create an `ARCHITECTURE.md` in the project root documenting the chosen stack and the reasoning. Include:

1. **System diagram** (described in text or ASCII): Client browser/mobile → CloudFront → ALB → EC2 (Node.js portal API) → PostgreSQL (CRM database) + Redis (cache) + S3 (documents)
2. **The CRM integration approach** (Option A shared database vs Option B separate with sync) — recommend Option A and explain why
3. **Data flow**: how a request travels from the client through to the CRM data and back
4. **Security boundaries**: where authentication happens, how per-client data isolation is enforced
5. **Scaling strategy**: how the system handles 10,000+ clients and traffic spikes

This document is the reference for all subsequent backend phases.

## Task 2: CRM Database Investigation & Connection

Since the team is unsure how the CRM currently stores and accesses data, the FIRST practical step is to investigate and document the existing CRM database.

Create a discovery checklist and helper scripts:

1. **Connect to the CRM PostgreSQL database** (read-only credentials initially for safety)
2. **Document the existing schema** — write a script that introspects and outputs:
   - All tables relevant to clients and claims
   - Column names, types, constraints
   - Primary keys and foreign key relationships
   - Existing indexes
3. **Map the CRM tables to portal needs:**
   - Where are client records stored? (need: client ID, name, DOB, email, phone)
   - Where are claim records stored? (need: claim ID, lender, status, dates)
   - Where are claim statuses stored? (the internal statuses from the spec)
   - Where are documents/financials linked?
   - Where are the outstanding requirement tick-boxes (ID verification, proof of address, etc.)?
4. **Identify the client-to-claim relationship** in the actual schema (the spec says one client has many claims with IDs like RR-676687-554/01)

Create `src/db/crm-introspection.ts` — a script that connects to the CRM database and outputs a full schema report to a file. Run this and document the findings in a `CRM_SCHEMA.md` file.

IMPORTANT: Use a read-only database user for introspection to avoid any accidental writes to the production CRM. Connection details must come from environment variables / AWS Secrets Manager, never hardcoded.

## Task 3: Portal Database Schema

Based on the CRM investigation, design the portal-specific schema. These are NEW tables the portal needs that do not exist in the CRM. Use a separate PostgreSQL schema named `portal` to keep them isolated from CRM tables.

Create Prisma schema (`prisma/schema.prisma`) with these portal tables:

```prisma
// Portal user accounts (separate from CRM client records)
// Links a portal login to a CRM client record
model PortalUser {
  id                String    @id @default(uuid())
  crmClientId       String    @unique  // Links to CRM client record (e.g. "RR-676687-554")
  email             String    @unique
  passwordHash      String              // bcrypt, 12+ rounds
  mpinHash          String?             // bcrypt-hashed 6-digit MPIN (nullable until set)
  phoneNumber       String              // For OTP
  isVerified        Boolean   @default(false)
  isLocked          Boolean   @default(false)
  lockoutUntil      DateTime?
  failedLoginCount  Int       @default(0)
  lastLoginAt       DateTime?
  registeredAt      DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  sessions          Session[]
  otpCodes          OtpCode[]
  auditLogs         AuditLog[]
  notificationPrefs NotificationPreference?

  @@schema("portal")
  @@index([crmClientId])
  @@index([email])
}

// Active sessions (refresh tokens)
model Session {
  id            String      @id @default(uuid())
  userId        String
  user          PortalUser  @relation(fields: [userId], references: [id], onDelete: Cascade)
  refreshToken  String      @unique   // Hashed
  deviceInfo    String?               // User agent / device fingerprint
  ipAddress     String?
  createdAt     DateTime    @default(now())
  expiresAt     DateTime
  lastActiveAt  DateTime    @default(now())
  revoked       Boolean     @default(false)

  @@schema("portal")
  @@index([userId])
  @@index([refreshToken])
}

// OTP codes (also cached in Redis with TTL, this is the audit trail)
model OtpCode {
  id          String      @id @default(uuid())
  userId      String
  user        PortalUser  @relation(fields: [userId], references: [id], onDelete: Cascade)
  codeHash    String                // Hashed OTP
  purpose     String                // "registration", "login", "password_reset"
  expiresAt   DateTime
  usedAt      DateTime?
  attempts    Int         @default(0)
  createdAt   DateTime    @default(now())

  @@schema("portal")
  @@index([userId])
}

// Notification preferences (per portal user)
model NotificationPreference {
  id                  String      @id @default(uuid())
  userId              String      @unique
  user                PortalUser  @relation(fields: [userId], references: [id], onDelete: Cascade)
  statusChanges       Boolean     @default(true)
  newMessages         Boolean     @default(true)
  documentRequests    Boolean     @default(true)
  offerNotifications  Boolean     @default(true)
  paymentUpdates      Boolean     @default(true)
  marketingEmails     Boolean     @default(false)
  updatedAt           DateTime    @updatedAt

  @@schema("portal")
}

// Audit log — every significant client action (security + compliance)
model AuditLog {
  id          String      @id @default(uuid())
  userId      String?
  user        PortalUser? @relation(fields: [userId], references: [id])
  action      String                // "login", "logout", "document_upload", "offer_accepted", etc.
  details     Json?                 // Structured detail of the action
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime    @default(now())

  @@schema("portal")
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// Notification log — record of emails/notifications sent
model NotificationLog {
  id          String      @id @default(uuid())
  userId      String
  type        String                // "status_change", "offer_received", etc.
  channel     String                // "email", "sms"
  recipient   String                // email or phone
  subject     String?
  status      String                // "queued", "sent", "failed"
  sentAt      DateTime?
  createdAt   DateTime    @default(now())

  @@schema("portal")
  @@index([userId])
  @@index([status])
}
```

Key design principles:
- Portal tables NEVER duplicate CRM data unnecessarily — they link via `crmClientId`
- Claims, claim statuses, documents, and financials are READ from the CRM, not stored again in the portal
- The portal only stores what the CRM does not: login credentials, MPINs, sessions, OTPs, preferences, audit logs, notification logs
- This avoids data duplication and keeps the CRM as the single source of truth

## Task 4: Database Connection & Pooling

Set up the database connection layer optimised for 10,000+ clients.

1. **Connection pooling** — configure Prisma/pg connection pool:
   - Min connections: 5
   - Max connections: 20 per EC2 instance (tune based on RDS max_connections and number of instances)
   - Use **PgBouncer** as a connection pooler in front of PostgreSQL if connection count becomes a bottleneck with multiple EC2 instances
2. **Two connection configs:**
   - Portal database connection (read-write to the `portal` schema)
   - CRM database connection (read-mostly to the `crm` schema — write only where the portal legitimately updates CRM data like document tick-boxes and offer acceptance)
3. **Read replicas** — for 10,000+ clients, configure RDS read replicas. Route read-heavy queries (claim lists, dashboards) to replicas, writes to the primary.

Create `src/db/index.ts` exporting configured Prisma clients with proper pooling.

## Task 5: CRM Data Access Layer

Create a clean abstraction layer for reading CRM data so the rest of the app never writes raw CRM queries. This isolates CRM-specific logic in one place — if the CRM schema changes, only this layer changes.

Create `src/services/crm/` with:

```
src/services/crm/
├── clients.ts       // getClientById, getClientByEmail, matchClient (for registration)
├── claims.ts        // getClaimsByClientId, getClaimById, getClaimTimeline
├── documents.ts     // getDocumentsByClientId, linkDocumentToClaim, updateRequirementTickbox
├── financials.ts    // getFinancialsByClaimId
├── offers.ts        // getOfferByClaimId, recordOfferAcceptance
├── requirements.ts  // getRequirementsByClientId, updateRequirement
└── mappers.ts       // Map CRM rows to portal API response shapes
```

Each function:
- Takes a CRM client ID or claim ID
- Enforces that data belongs to the authenticated client (per-account isolation)
- Maps raw CRM data to the clean response shapes the frontend already expects (matching the mock data structures from Phases 1.5–4.1)
- Uses the statusMapping logic (internal status → client phase) — port the frontend statusMapping.ts logic to the backend, OR keep it frontend-side and send raw internal status. Recommend backend mapping so hidden statuses are NEVER sent to the client (security: hidden statuses like "Weak Case Cannot Continue" must never leave the server)

CRITICAL — Hidden status filtering:
The spec lists hidden internal statuses (New Lead, Contact Attempted, Not Qualified, Sale, Counter Team, Weak Case Cannot Continue) that must NEVER be shown to clients. The CRM data access layer must filter these out server-side. A claim in a hidden status should either not appear in the client's claim list, or be mapped to a safe generic phase. This filtering happens on the backend so the sensitive status never reaches the client device.

## Task 6: Per-Client Data Isolation (Security Core)

This is the most security-critical piece. Every data access must guarantee a client can only ever see their own data — like separate bank accounts.

Implement at multiple layers:

1. **JWT contains the crmClientId** — when a user logs in, their token embeds their verified crmClientId
2. **Middleware extracts and validates** the crmClientId from the JWT on every request
3. **Every CRM query is scoped** — the data access layer ALWAYS filters by the authenticated crmClientId. There is no endpoint that accepts a client ID from the request body/params for data access — it always comes from the verified token.
4. **Claim ID validation** — when a client requests /claims/:id, verify that claim belongs to their crmClientId before returning anything. Return 404 (not 403) for claims that exist but belong to others, so the existence of other claims is not revealed.
5. **Document access** — pre-signed S3 URLs are generated only after verifying the document belongs to the authenticated client.

Create `src/middleware/auth.ts` and `src/middleware/ownership.ts` to enforce this.

## Task 7: Authentication Infrastructure (OTP + MPIN + Password)

Build the core auth services matching the banking-app login experience described.

### Registration flow (first-time):
1. Client enters First Name, Last Name, DOB, Email
2. Backend matches against CRM client records (via crm/clients.ts matchClient)
3. If matched: generate OTP, send via Twilio to the CRM-registered phone number, store OTP hash in Redis (5-min TTL) + DB audit
4. Client enters OTP → verify against Redis
5. Client creates a password (bcrypt 12 rounds) AND optionally sets a 6-digit MPIN
6. Create PortalUser record linked to crmClientId
7. Issue JWT access + refresh tokens

### Login flow (returning client — banking-app style):
Two login paths:

**Path A — Phone + OTP (primary, like banking apps):**
1. Client enters phone number (or email)
2. Backend finds the PortalUser, sends OTP via Twilio
3. Client enters OTP → verified → issue tokens

**Path B — Email + Password:**
1. Standard email + password login (bcrypt verify)
2. Issue tokens

**MPIN — fast re-access:**
1. After first full login on a device, client can set a 6-digit MPIN
2. On subsequent app opens, client enters MPIN instead of full login
3. MPIN is verified against the bcrypt-hashed mpinHash
4. MPIN is device-scoped — tied to a session/device, with a fallback to full OTP login
5. MPIN lockout: 5 wrong attempts → require full OTP login

Create:
```
src/services/auth/
├── registration.ts   // Match CRM, send OTP, create account
├── login.ts          // Password and OTP login paths
├── mpin.ts           // Set, verify, reset MPIN
├── otp.ts            // Generate, send (Twilio), verify OTP (Redis-backed)
├── tokens.ts         // JWT generation, refresh, revocation
└── password.ts       // Hash, verify, reset password
```

### Token strategy:
- Access token: JWT, 15-minute expiry, contains userId + crmClientId
- Refresh token: opaque or JWT, 7-day expiry, stored hashed in Session table, rotated on use
- Auto-logout after 30 min inactivity (frontend already handles the warning; backend invalidates the session)

## Task 8: Caching Layer (Redis)

Set up Redis (ElastiCache) for the speed requirements.

Create `src/cache/index.ts` with a Redis client and caching utilities:

1. **OTP storage** — store OTP codes with 5-minute TTL (auto-expiry, no manual cleanup)
2. **Session cache** — cache active session validation to avoid DB hits on every request
3. **Claim list cache** — cache a client's claim list for 60 seconds (invalidate on status change). Dramatically speeds up dashboard loads.
4. **Rate limiting** — store request counts per IP/user with sliding windows
5. **MPIN attempt tracking** — track failed MPIN attempts in Redis

Cache invalidation strategy:
- When CRM data changes (status update, new message, offer), invalidate the relevant client's cache
- Use cache keys scoped by crmClientId (e.g. `claims:RR-676687-554`)
- Set sensible TTLs so stale data self-corrects even if invalidation is missed

## Task 9: Data Backup & Disaster Recovery

This addresses the "crucial data backup preservance" requirement — ensure no data loss even if something goes wrong.

Set up a layered backup strategy:

1. **RDS automated backups:**
   - Enable automated daily snapshots with 30-day retention
   - Enable **point-in-time recovery (PITR)** — allows restoring to any second within the retention window
   - Multi-AZ deployment for automatic failover (high availability)

2. **Manual snapshot before major changes:**
   - Document a process: before any schema migration or major deployment, take a manual RDS snapshot
   - Manual snapshots are retained until explicitly deleted (survive beyond the automated retention window)

3. **Cross-region backup replication:**
   - Replicate RDS snapshots to a second AWS region for disaster recovery (protects against region-wide outages)

4. **S3 backup for documents:**
   - Enable S3 versioning on the documents bucket (recover deleted/overwritten files)
   - Enable S3 cross-region replication for document backups
   - Lifecycle policy: move old versions to Glacier for cost-effective long-term retention

5. **Logical backups:**
   - Scheduled `pg_dump` exports of the portal schema to S3 (daily), retained 90 days
   - These are portable logical backups independent of RDS snapshots

6. **Audit log preservation:**
   - The AuditLog and NotificationLog tables are append-only compliance records
   - Archive old audit logs to S3/Glacier rather than deleting (regulatory requirement for a claims firm)

Document all of this in a `BACKUP_RECOVERY.md` file including:
- Backup schedule and retention periods
- Step-by-step recovery procedures (how to restore from a snapshot, how to do PITR)
- RTO (Recovery Time Objective) and RPO (Recovery Point Objective) targets
- Who is responsible and how to test recovery periodically

## Task 10: EC2 Hosting Setup

Document and script the EC2 deployment.

1. **EC2 instance setup:**
   - Ubuntu 24.04 LTS, t3.large or m5.large to start
   - Node.js 20 LTS, PM2 for process management
   - Nginx as a reverse proxy in front of the Node app (handles TLS termination, gzip, static caching)

2. **Environment configuration:**
   - All secrets (DB credentials, JWT secret, Twilio keys, AWS keys) in **AWS Secrets Manager**, never in .env files on the server
   - Environment-specific configs: development, staging, production

3. **Process management with PM2:**
   - Cluster mode: run one Node process per CPU core (utilises all cores)
   - Auto-restart on crash
   - Zero-downtime reloads on deployment

4. **Load balancer & auto-scaling (for 10,000+ clients):**
   - Application Load Balancer in front of EC2 instances
   - Auto Scaling Group: scale out when CPU > 70%, scale in when < 30%
   - Health checks on a /health endpoint

5. **TLS/HTTPS:**
   - ACM (AWS Certificate Manager) certificate on the ALB
   - Enforce HTTPS, TLS 1.2+ (per the original spec security requirements)

6. **Monitoring:**
   - CloudWatch for CPU, memory, request latency, error rates
   - Alarms for high error rate, high latency, instance health
   - Centralised logging (CloudWatch Logs or a service like Datadog)

Create:
- `deploy/ec2-setup.md` — step-by-step server provisioning guide
- `deploy/nginx.conf` — Nginx reverse proxy config
- `deploy/ecosystem.config.js` — PM2 cluster configuration
- `.env.example` — documents all required environment variables (with placeholder values)

## Task 11: Performance Optimisation Foundations

Bake in performance from the start to meet the "no lag, peak optimisation" requirement.

1. **Database indexing:**
   - Index all foreign keys and frequently queried columns (crmClientId, email, claim status)
   - Add composite indexes for common query patterns (e.g. client claims sorted by last updated)
   - Document the indexing strategy

2. **Query optimisation:**
   - Use SELECT with specific columns, never SELECT *
   - Paginate large result sets (claims, documents, messages, audit logs)
   - Use database-level JOINs rather than N+1 queries
   - Analyse slow queries with EXPLAIN ANALYZE

3. **Response optimisation:**
   - gzip/brotli compression on all responses (via Nginx)
   - HTTP caching headers for static/cacheable data
   - Minimise payload size — only send what the frontend needs

4. **Connection efficiency:**
   - Connection pooling (Task 4)
   - Keep-alive connections
   - Redis caching to avoid repeated DB hits (Task 8)

5. **Health & metrics endpoint:**
   - /health — liveness check for the load balancer
   - /metrics — internal metrics (response times, cache hit rates, DB pool usage)

## Task 12: Project Structure & Scaffolding

Set up the backend project structure (this is a NEW backend project, separate from the frontend React app, OR a backend folder within a monorepo).

```
rowan-rose-portal-api/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/              // Environment, constants
│   ├── db/                  // DB connections, pooling
│   ├── cache/               // Redis client and utilities
│   ├── middleware/          // Auth, ownership, rate limiting, error handling
│   ├── services/
│   │   ├── auth/            // OTP, MPIN, password, tokens, registration, login
│   │   ├── crm/             // CRM data access layer
│   │   └── notifications/   // Email/SMS sending (templates come in a later task)
│   ├── routes/              // API route definitions (endpoints built in Phase 7.1)
│   ├── utils/               // Shared utilities
│   ├── types/               // Shared TypeScript types (share with frontend where possible)
│   └── server.ts            // App entry point
├── deploy/                  // Deployment configs and guides
├── .env.example
├── ARCHITECTURE.md
├── CRM_SCHEMA.md
├── BACKUP_RECOVERY.md
├── package.json
└── tsconfig.json
```

</tasks>

<deliverables>
This phase produces the backend FOUNDATION, not feature endpoints. By the end you should have:
- Documented architecture and chosen tech stack (ARCHITECTURE.md)
- CRM database schema investigated and documented (CRM_SCHEMA.md)
- Portal database schema defined and migrated (Prisma)
- Database connection layer with pooling
- CRM data access abstraction layer
- Per-client data isolation enforced via middleware
- Full authentication infrastructure (OTP, MPIN, password, JWT)
- Redis caching layer
- Backup and disaster recovery plan (BACKUP_RECOVERY.md)
- EC2 hosting setup guides and configs
- Performance optimisation foundations (indexing, pooling, caching)
- Backend project scaffolded and ready for endpoint implementation

The actual API ENDPOINTS that the frontend calls are built in Phase 7.1, on top of this foundation.
</deliverables>

<security_requirements>
- All data in transit over HTTPS/TLS 1.2+
- Passwords and MPINs hashed with bcrypt (12+ rounds)
- Data at rest encrypted (RDS encryption, S3 encryption — AES-256)
- Secrets in AWS Secrets Manager, never in code or .env on servers
- Per-client data isolation enforced server-side on every query
- Hidden CRM statuses filtered server-side, never sent to clients
- Rate limiting on all auth endpoints (Redis-backed)
- Audit logging of all significant client actions
- CSRF protection, security headers (Helmet)
- SQL injection prevention (parameterised queries via Prisma)
- Pre-signed, time-limited S3 URLs for document access
- GDPR compliance: data export capability, audit trail, secure deletion process
</security_requirements>

<acceptance_criteria>
- [ ] ARCHITECTURE.md documents the full stack and CRM integration approach
- [ ] CRM database introspection script runs and produces CRM_SCHEMA.md
- [ ] Portal Prisma schema defined with all tables in the `portal` schema
- [ ] Prisma migrations run successfully against the database
- [ ] Database connection layer configured with pooling (separate portal and CRM connections)
- [ ] CRM data access layer abstracts all CRM reads/writes
- [ ] Hidden CRM statuses filtered out server-side
- [ ] Per-client data isolation middleware enforces token-based scoping
- [ ] Claim ownership validation returns 404 for other clients' claims
- [ ] OTP service generates, sends (Twilio), and verifies codes via Redis with TTL
- [ ] MPIN service sets, verifies, and locks out after failed attempts
- [ ] Password service hashes with bcrypt 12+ rounds
- [ ] JWT access + refresh token system with rotation and revocation
- [ ] Registration matches CRM records and creates linked PortalUser
- [ ] Login supports both OTP and password paths
- [ ] Redis caching layer configured with claim list caching and invalidation
- [ ] Rate limiting works via Redis
- [ ] BACKUP_RECOVERY.md documents the full backup and DR strategy
- [ ] RDS automated backups, PITR, and Multi-AZ documented/configured
- [ ] S3 versioning and cross-region replication documented/configured
- [ ] EC2 setup guide, Nginx config, and PM2 cluster config created
- [ ] Health and metrics endpoints implemented
- [ ] Database indexing strategy documented and applied
- [ ] .env.example documents all required environment variables
- [ ] Backend project scaffolded with the full folder structure
- [ ] No secrets hardcoded anywhere in the codebase
</acceptance_criteria>

<notes_for_next_phase>
Phase 7.1 will build the actual REST API endpoints on top of this foundation — the endpoints listed in the original spec (/auth/register, /auth/login, /client/claims, /client/documents/upload, etc.). These endpoints will use the CRM data access layer, auth middleware, and caching built here. Then the frontend mock API calls (from Phases 1.3 through 5.1) will be swapped to call these real endpoints. Phase 7.2 will add real-time updates via polling or WebSockets.
</notes_for_next_phase>

## Build Notes

- 2026-06-01: Started Phase 6.1 backend foundation in `backend/` using TypeScript, Prisma, Express, PostgreSQL, Redis, Twilio, and PM2/Nginx deploy config.
- 2026-06-01: Task 2 was attempted first. Added `backend/src/db/crm-introspection.ts` and ran `npm run crm:introspect`. The script produced `CRM_SCHEMA.md`, but live CRM discovery is pending because this workspace has no `CRM_READONLY_DATABASE_URL` or `CRM_DATABASE_URL`.
- 2026-06-01: Added root `ARCHITECTURE.md`, `CRM_SCHEMA.md`, and `BACKUP_RECOVERY.md`.
- 2026-06-01: Added Prisma `portal` schema and initial migration for portal users, sessions, OTP audit, notification preferences/logs, and audit logs. Prisma generate succeeded. `npm run prisma:migrate` could not apply locally because the configured dev database at `localhost:5433` is not listening.
- 2026-06-01: Added CRM data access layer with configurable table/column mappings, server-side hidden status filtering, claim ownership checks, and CRM writes disabled by default.
- 2026-06-01: Added auth services for password hashing, OTP, MPIN, JWT access/refresh rotation, registration, login, and audit logging.
- 2026-06-01: Added Redis cache utilities, Redis-backed rate limiting configuration, health and metrics endpoints, EC2 setup guide, Nginx config, PM2 config, and expanded `.env.example`.
- 2026-06-01: Verification: `npm run prisma:generate`, `npm run check`, and `npm run build` pass. `npm run crm:introspect` exits non-zero by design until a read-only CRM URL is configured, and writes the pending CRM schema report.
