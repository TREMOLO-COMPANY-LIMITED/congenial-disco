# Authentication Flow

## Overview

Email + password registration and login using Better Auth with mandatory email verification.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Auth | Better Auth |
| Email | Resend (`noreply@kafka.design`) |
| Validation | Zod (shared schemas in `@starter/shared`) |
| Forms | React Hook Form + `@hookform/resolvers` |
| DB | Drizzle ORM + PostgreSQL (UUID primary keys) |

## Flows

### Registration

```
User                    Frontend                   API (Better Auth)           Resend
 │                         │                            │                       │
 ├─ Fill form ───────────► │                            │                       │
 │                         ├─ Zod validation            │                       │
 │                         ├─ signUp.email() ─────────► │                       │
 │                         │                            ├─ Create user           │
 │                         │                            │  (emailVerified=false) │
 │                         │                            ├─ Send email ─────────► │
 │                         │                            │                       ├─► Email to user
 │                         ◄─ Response ─────────────────┤                       │
 │  ◄─ Redirect to         │                            │                       │
 │     /auth/verify-email  │                            │                       │
 │                         │                            │                       │
 ├─ Click email link ─────────────────────────────────► │                       │
 │                         │                            ├─ Verify token          │
 │                         │                            ├─ emailVerified = true  │
 │  ◄─ Redirect to /auth/login?verified=true ───────────┤                       │
 │                         │                            │                       │
```

**Steps:**

1. User fills the form at `/auth/register` (name, email, password, password confirmation)
2. Frontend validates with Zod (`registerSchema`)
3. `authClient.signUp.email()` → `POST /api/auth/sign-up/email`
4. Better Auth creates user in DB (`emailVerified = false`)
5. `sendVerificationEmail` callback sends verification email via Resend
6. Frontend redirects to `/auth/verify-email?email=xxx`
7. User clicks the verification link in email
8. Better Auth API verifies token server-side, sets `emailVerified = true`
9. Redirects to `/auth/login?verified=true` based on `callbackURL`

### Login

```
User                    Frontend                   API (Better Auth)
 │                         │                            │
 ├─ Enter credentials ───► │                            │
 │                         ├─ Zod validation            │
 │                         ├─ signIn.email() ─────────► │
 │                         │                            ├─ Check emailVerified
 │                         │                            │  ├─ false → Error
 │                         │                            │  └─ true  → Create session
 │                         ◄─ Response ─────────────────┤
 │  ◄─ Redirect to / ──── │                            │
 │                         │                            │
```

**Steps:**

1. User enters email and password at `/auth/login`
2. `authClient.signIn.email()` → `POST /api/auth/sign-in/email`
3. If `emailVerified = false`, returns error (email verification required)
4. On success: session created, redirect to `/`

## Pages

| Path | File | Description |
|------|------|-------------|
| `/auth/register` | `apps/web/src/app/auth/register/page.tsx` | Registration form |
| `/auth/verify-email` | `apps/web/src/app/auth/verify-email/page.tsx` | "Check your email" screen |
| `/auth/login` | `apps/web/src/app/auth/login/page.tsx` | Login form |
| `/auth/*` (shared) | `apps/web/src/app/auth/layout.tsx` | Centered card layout |

## Validation

Defined in `packages/shared/src/types/auth.ts`. Shared between frontend and backend.

**Password requirements:**
- 8+ characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

**Registration schema (`registerSchema`):**
- `name`: 1–100 characters
- `email`: valid email address
- `password`: meets password requirements above
- `passwordConfirmation`: must match `password`

**Login schema (`loginSchema`):**
- `email`: valid email address
- `password`: 1+ characters

## Backend Configuration

### Better Auth (`apps/api/src/lib/auth.ts`)

- `emailAndPassword.requireEmailVerification: true` — login blocked without verified email
- `emailVerification.sendOnSignUp: true` — sends verification email on registration
- `emailVerification.autoSignInAfterVerification: false` — no auto sign-in after verification
- `advanced.database.generateId: "uuid"` — matches UUID column types in DB
- `trustedOrigins` — allows frontend origin (cross-origin support)
- Drizzle adapter with explicit `schema` mapping (`user`, `session`, `account`, `verification`)

### Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `BETTER_AUTH_SECRET` | `apps/api/.dev.vars` | Session encryption key |
| `BETTER_AUTH_URL` | `apps/api/.dev.vars` | Better Auth API URL |
| `RESEND_API_KEY` | `apps/api/.dev.vars` | Resend API key |
| `WEB_URL` | `apps/api/wrangler.toml` | Frontend URL (used in email links) |
| `NEXT_PUBLIC_API_URL` | `apps/web/.env.local` | API server URL |

## DB Schema

Defined in `packages/db/src/schema/index.ts`. Four tables used by Better Auth:

- **users** — `id`, `email`, `name`, `image`, `emailVerified`, `createdAt`, `updatedAt`
- **sessions** — `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`
- **accounts** — `id`, `userId`, `accountId`, `providerId`, `password`, tokens
- **verifications** — `id`, `identifier`, `value`, `expiresAt`

## Tests

```bash
# Shared schema tests (11 tests)
cd packages/shared && pnpm vitest run

# Frontend tests (18 tests)
cd apps/web && pnpm vitest run
```

## Out of Scope

- Social login (Google, GitHub, etc.)
- Password reset
- Profile image upload (separate flow after registration)
- Account deletion
- Rate limiting
