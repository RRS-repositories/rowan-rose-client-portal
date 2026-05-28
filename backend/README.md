# Rowan Rose Portal — Backend (auth slice)

Basic accounts backend started in Phase 1.4 at Brad's explicit direction: **email →
email-OTP → password → profile (18+) → signed in**, plus login and password reset,
persisted in **Postgres**. The broader CRM integration (claims/documents/messages,
real email/SMS, S3) remains future work — see `CLAUDE.md`.

Stack: Node 22 (ESM) · Express · `pg` · `bcryptjs` · `jsonwebtoken`.

## Run it

```bash
# 1) Postgres (Docker) — host port 5433 to avoid the system PG on 5432
docker compose up -d

# 2) install + migrate (creates tables, seeds a test user)
npm install
npm run migrate

# 3) start the API on http://localhost:4000
npm run dev
```

The frontend talks to it via `frontend/app/.env` (`VITE_API_URL=http://localhost:4000`,
`VITE_USE_MOCKS=false`). Start the frontend with `npm run dev` in `frontend/app`.

## Notes

- **Seeded test login:** `client@test.com` / `Password1` (Sarah Holden — matches the mock dashboard).
- **OTP / email:** no email provider is wired yet, so the 6-digit code is logged
  server-side and returned as `devCode` (gated by `EXPOSE_OTP=true`). The signup
  page shows it as a dev hint. Turn `EXPOSE_OTP=false` once Office 365 email is connected.
- **Security:** passwords hashed with bcrypt (12 rounds); OTPs expire in 5 min with a
  5-attempt cap; scoped JWTs (`signup` / `session` / `reset`).
- **Endpoints:** `POST /auth/register-start`, `/auth/verify-otp`, `/auth/resend-otp`,
  `/auth/complete-registration`, `/auth/login`, `/auth/request-reset`, `/auth/set-new-password`; `GET /health`.
- Expected auth failures return **200** with `{ success:false, message }` (the frontend
  `apiClient` throws on non-2xx) — non-2xx is reserved for unexpected errors.
- `.env` is git-ignored; `.env.example` documents the keys.
