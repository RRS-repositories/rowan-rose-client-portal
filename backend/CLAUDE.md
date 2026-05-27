# Backend — Rowan Rose Client Portal

## 🛑 STOP — This folder is NOT in scope yet.

Brad has explicitly sequenced this project: **frontend gets fully built and approved before any backend work begins.**

If you are reading this file because a user request has led you to start backend work while `frontend/` is not yet fully built and signed off, **stop and confirm with Brad before proceeding.** Do not assume.

Until then, this folder stays empty. Do not pre-emptively scaffold, do not create starter files, do not run `npm init`, do not write API stubs.

---

## When the Time Comes

When Brad signals that backend work begins, the following context will apply.

### Integration Target

This portal connects into Brad's **existing custom CRM**:
- Hosting: AWS
- Stack: Node.js / PostgreSQL / React
- Scale: ~90k contacts, ~108k claims
- Workflow automation: Windmill (replaced n8n for most workers)
- AI inference: Ollama/Gemma local + Gemini failover
- Email: Office 365
- SMS: Twilio
- File storage: AWS S3
- Notifications (internal): Mattermost
- Document generation: OnlyOffice

The portal is **mostly a read layer** on top of the CRM, with limited write operations.

### API Endpoints to Implement (from old spec — confirm with Brad first)

**Auth:**
- `POST /auth/register` — validate client details, initiate OTP
- `POST /auth/verify-otp` — verify OTP, create account
- `POST /auth/login` — email + password
- `POST /auth/reset-password` — initiate password reset via email

**Client data (read):**
- `GET /client/claims` — all claims for authenticated client
- `GET /client/claims/:id` — detailed claim info + timeline
- `GET /client/requirements` — outstanding tick-boxes
- `GET /client/documents` — uploaded documents list
- `GET /client/messages/:claimId` — message thread
- `GET /client/financials/:claimId` — financial summary (progressive based on phase)

**Client data (write):**
- `POST /client/documents/upload` — upload to S3, link to CRM record, auto-update tick-boxes
- `POST /client/messages/:claimId` — send reply
- `POST /client/offers/:claimId/accept` — submit signed acceptance (typed name + checkbox + timestamp)

### Real-Time Layer

- **WebSockets via Socket.io** (NOT polling). Integrates natively with the existing Node.js backend. Push status updates and new messages only when something changes.
- **Firebase Cloud Messaging** for mobile push notifications (iOS + Android from one config).
- **Email triggers** via existing email infra — confirm whether SES, SendGrid, or other before implementation.

### Security Floor

- HTTPS / TLS 1.2+ everywhere
- bcrypt for password hashing (12+ rounds)
- OTP codes expire after 5 minutes
- CSRF protection on all forms
- Rate limiting on auth endpoints (max 5 failed logins → 15-min lockout)
- AES-256 encryption at rest
- Audit logging for all client actions
- GDPR (ICO) + SRA compliant
- Refresh tokens stored in Keychain (iOS) / Keystore (Android) for session handoff
- Penetration test scheduled BEFORE the document upload + offer acceptance flow goes live (not at the end)

### Performance Targets

- Page load under 2 seconds
- 500+ concurrent users supported
- File uploads with real progress indicator

### Open Questions for Brad (When Backend Phase Begins)

These must be answered before scaffolding:
- [ ] Existing auth infrastructure in the CRM to reuse, or build fresh?
- [ ] DB schema docs available for client/claim/requirement relationships?
- [ ] AWS region preference? Containerisation (ECS/Docker)?
- [ ] Existing email infrastructure (SES, SendGrid, other)?
- [ ] Twilio account — reuse CRM's existing account or separate sub-account?
- [ ] CI/CD pipeline to integrate with?
- [ ] App Store / Google Play developer accounts already set up?
- [ ] Preferred mobile document scanning library (react-native-document-scanner vs alternatives)?

---

## Recap: Do Not Start

This folder stays empty until the frontend (Phase A + Phase B) is fully built and Brad explicitly says "begin backend." Then come back here, re-read this file, and start with the open questions above.
