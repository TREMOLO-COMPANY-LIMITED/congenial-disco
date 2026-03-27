# Security Rules

## Never Do These

- hardcode API keys, secrets, or tokens in source code
- commit `.env`, `.env.local`, `.dev.vars`, or other secret-bearing files
- log passwords, tokens, session cookies, or private user data
- expose state-changing endpoints without authentication when they should be protected
- allow users to escalate their own privileges or change protected fields without authorization checks
- trust client-provided identifiers without verifying ownership or role access
- use `eval()` or similarly unsafe dynamic execution

## Required Practices

- source secrets from environment variables
- protect admin-only operations with explicit authorization checks
- validate inputs at request boundaries
- handle failures safely for DB, Redis, R2, Resend, and Sentry interactions
- keep upload endpoints constrained by content type and file size
- avoid leaking internal-only fields in API responses
- keep CORS and trusted origins aligned with the actual frontend origins

## Auth-Specific Expectations

- Better Auth secrets and URLs must come from env
- session-based auth flows should be used consistently
- admin middleware must protect admin endpoints
- role updates and ban/unban flows must be reviewed for privilege escalation risks

## Review Triggers

Apply extra scrutiny when changes touch:

- `apps/api/src/lib/auth.ts`
- `apps/api/src/routes/admin/**`
- `apps/api/src/routes/upload/**`
- auth pages in `apps/web/src/app/auth/**`
- env bindings in `apps/api/src/types.ts`
- role or banned fields in `packages/db/src/schema/index.ts`
