# Architecture Overview

## Summary

This repository is a `pnpm` + Turborepo monorepo with three apps and several shared packages.

- `apps/web` - public-facing Next.js app
- `apps/admin` - admin Next.js app
- `apps/api` - Hono API running on Cloudflare Workers
- `packages/db` - Drizzle ORM schema, client, migrations, seed scripts
- `packages/shared` - shared types and utilities
- `packages/ui` - shared UI components
- `packages/typescript-config` / `packages/eslint-config` - shared tooling config

## System Architecture

```text
                            Monorepo (Turborepo + pnpm)

   ┌──────────────────────┐      HTTP / JSON      ┌─────────────────────────┐
   │ apps/web             │ ───────────────────▶ │ apps/api                │
   │ Next.js 15 + React 19│                      │ Hono + OpenAPIHono      │
   │ Port 3000            │ ◀─────────────────── │ Cloudflare Workers       │
   └──────────────────────┘                      │ Port 8787 (local)       │
                                                 └───────────┬─────────────┘
                                                             │
   ┌──────────────────────┐      HTTP / JSON                 │
   │ apps/admin           │ ─────────────────────────────────┘
   │ Next.js 15 + React 19│
   │ Port 3001            │
   └──────────────────────┘

   ┌──────────────────────┐
   │ packages/shared      │ shared Zod-compatible types / utilities
   │ packages/ui          │ shared UI components
   │ packages/db          │ Drizzle schema / DB client / migrations
   └──────────────────────┘

                                   External Services

          PostgreSQL          Redis REST            Cloudflare R2
          (local Docker /     (local proxy /        (object storage)
          Supabase)           Upstash style)

                            Resend               Sentry
                            (email)              (monitoring)
```

## Tech Stack

| Layer | Technology | Purpose |
|------|------------|---------|
| Frontend | Next.js 15 + React 19 | Web and admin applications |
| Styling | Tailwind CSS 4 | Application styling |
| UI | Shared components in `@starter/ui` | Reusable UI building blocks |
| Forms | React Hook Form + Zod | Client form handling and validation |
| Data Fetching | `fetch` wrappers + TanStack Query | API integration and server state |
| State | Zustand | Local client state where needed |
| Backend | Hono + `@hono/zod-openapi` | HTTP API and OpenAPI docs |
| Auth | Better Auth | Email/password auth and sessions |
| ORM | Drizzle ORM | Database schema and access |
| Database | PostgreSQL | Primary relational database |
| Cache | Redis via Upstash-compatible REST | Simple verification and cache-style use cases |
| Storage | Cloudflare R2 | File upload storage |
| Email | Resend | Transactional email delivery |
| Monitoring | Sentry | Error reporting |
| Testing | Vitest, Testing Library, Playwright | Unit, integration, and E2E tests |
| Tooling | Turborepo + pnpm | Monorepo task orchestration |

## Repository Structure

```text
starter/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── lib/
│   │   │   │   ├── auth.ts
│   │   │   │   └── r2.ts
│   │   │   └── routes/
│   │   │       ├── health.ts
│   │   │       ├── auth.ts
│   │   │       ├── verify/
│   │   │       ├── upload/
│   │   │       └── admin/
│   │   ├── wrangler.toml
│   │   └── vitest.config.ts
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── auth/
│   │   │   │   ├── profile/
│   │   │   │   └── verify/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── vitest.config.ts
│   └── admin/
│       ├── src/
│       │   ├── app/
│       │   │   ├── login/
│       │   │   └── (dashboard)/
│       │   ├── components/
│       │   └── lib/
│       └── package.json
├── packages/
│   ├── db/
│   ├── shared/
│   ├── ui/
│   ├── typescript-config/
│   └── eslint-config/
├── e2e/
├── docs/
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Applications

### `apps/web`

Public-facing application built with Next.js App Router.

Key areas:

- `/` - basic home page
- `/auth/register` - registration flow
- `/auth/login` - login flow
- `/auth/verify-email` - email verification guidance
- `/verify` - service verification dashboard
- `/profile` - authenticated profile page with avatar upload

Main frontend concerns:

- Better Auth client setup
- API requests through `src/lib/api.ts`
- verification state via Zustand
- forms with React Hook Form + Zod
- avatar upload flow using presigned URLs

### `apps/admin`

Admin-facing application built with Next.js App Router.

Key areas:

- `/login` - admin sign-in
- `/dashboard` - dashboard landing page
- `/users` - user list
- `/users/[id]` - user detail page

The admin app talks to the same API and relies on admin-only endpoints protected by API middleware.

### `apps/api`

Backend API built with Hono and OpenAPIHono, designed for Cloudflare Workers deployment.

Main responsibilities:

- health and verification endpoints
- Better Auth handler mounting
- presigned upload URL generation
- admin-only endpoints
- CORS policy for `web` and `admin`
- access to PostgreSQL, Redis REST, R2, Resend, and Sentry

## Shared Packages

### `packages/db`

Database package containing:

- Drizzle schema definitions
- DB client factory
- migration files under `drizzle/`
- admin seed script

### `packages/shared`

Shared types and utilities consumed by both apps and the API.

Current shared areas include:

- auth-related types
- upload-related types
- admin-related types
- verify/health response types

### `packages/ui`

Reusable UI components shared across apps, such as:

- `Button`
- `Input`
- `Card`
- `Badge`
- `Label`
- `Table`
- `Separator`

## Dependency Flow

```text
apps/web   ─┬──▶ @starter/shared
            └──▶ @starter/ui

apps/admin ─┬──▶ @starter/shared
            └──▶ @starter/ui

apps/api   ─┬──▶ @starter/shared
            └──▶ @starter/db

e2e        ────▶ apps/web + apps/api
```

## API Surface

The main API is mounted in [apps/api/src/index.ts](/Users/taichitakeda/dev/starter/apps/api/src/index.ts).

### Core Routes

| Method | Path | Purpose |
|------|------|---------|
| `GET` | `/health` | Basic health check |
| `GET` | `/verify/db` | Database connectivity check |
| `GET` | `/verify/redis` | Redis REST connectivity check |
| `GET` | `/verify/r2` | R2 credential and bucket check |
| `GET` | `/verify/resend` | Resend API key check |
| `GET` | `/verify/sentry` | Sentry DSN check |
| `GET` | `/verify/all` | Aggregated verification report |
| `ALL` | `/api/auth/*` | Better Auth routes |
| `POST` | `/upload/presigned-url` | Generate upload URL for avatars |
| `GET` | `/admin/me` | Current admin info |
| `GET` | `/admin/users` | Admin user list |
| `GET` | `/admin/users/:id` | Admin user detail |
| `PATCH` | `/admin/users/:id/role` | Update user role |
| `PATCH` | `/admin/users/:id/ban` | Update ban state |
| `GET` | `/doc` | OpenAPI document |

## Authentication Model

Authentication is handled by Better Auth in the API layer and consumed from both Next.js apps.

High-level flow:

1. A frontend calls the Better Auth client.
2. The request goes to `/api/auth/*` on the Hono API.
3. Better Auth reads/writes data through Drizzle and PostgreSQL.
4. Session cookies are issued by the API.
5. Protected admin routes pass through dedicated middleware.

Trusted origins are configured from:

- `WEB_URL` defaulting to `http://localhost:3000`
- `ADMIN_URL` defaulting to `http://localhost:3001`

## Data Model

The main auth-related schema is defined in [packages/db/src/schema/index.ts](/Users/taichitakeda/dev/starter/packages/db/src/schema/index.ts).

### Tables

#### `users`

- `id`
- `email`
- `name`
- `image`
- `role`
- `banned`
- `bannedReason`
- `emailVerified`
- `createdAt`
- `updatedAt`

#### `sessions`

- `id`
- `userId`
- `token`
- `expiresAt`
- `ipAddress`
- `userAgent`
- `createdAt`
- `updatedAt`

#### `accounts`

- `id`
- `userId`
- `accountId`
- `providerId`
- `accessToken`
- `refreshToken`
- `accessTokenExpiresAt`
- `refreshTokenExpiresAt`
- `scope`
- `idToken`
- `password`
- `createdAt`
- `updatedAt`

#### `verifications`

- `id`
- `identifier`
- `value`
- `expiresAt`
- `createdAt`
- `updatedAt`

## Upload Flow

Avatar upload is split across the web app, API, and R2.

```text
Web profile page
  -> request POST /upload/presigned-url
  -> API validates file metadata and returns presigned URL
  -> browser uploads directly to Cloudflare R2
  -> frontend updates user profile image through Better Auth
```

This keeps file bytes out of the application server while still enforcing file constraints server-side.

## Verification Endpoints

The `/verify/*` routes are operational diagnostics for local development and environment setup.

They validate:

- database access
- Redis REST access
- R2 credentials
- Resend configuration
- Sentry configuration

The `/verify/all` endpoint aggregates them into a single response for dashboard-style inspection.

## Local Development Architecture

### Ports

| Service | Port |
|------|------|
| Web | `3000` |
| Admin | `3001` |
| API | `8787` |
| PostgreSQL | `5432` |
| Redis | `6379` |
| Redis REST proxy | `8079` |

### Local Infrastructure

`docker-compose.yml` provides:

- PostgreSQL 16
- Redis 7
- Redis REST proxy for Upstash-compatible API access

Typical local flow:

```bash
pnpm install
pnpm db:setup
pnpm dev
```

## Deployment Model

Current intended deployment split:

| Part | Platform |
|------|----------|
| `apps/web` | Vercel |
| `apps/admin` | Vercel |
| `apps/api` | Cloudflare Workers |
| PostgreSQL | Supabase |
| Redis | Upstash |
| Object storage | Cloudflare R2 |
| Email | Resend |
| Monitoring | Sentry |

## Testing Strategy

| Layer | Tooling |
|------|---------|
| API unit/integration | Vitest |
| Web/Admin component tests | Vitest + Testing Library |
| End-to-end | Playwright |

Playwright lives in `e2e/` and starts `apps/api` and `apps/web` as local web servers during test runs.

## Related Documents

- [development-workflow.md](/Users/taichitakeda/dev/starter/docs/development-workflow.md)
- [troubleshooting.md](/Users/taichitakeda/dev/starter/docs/troubleshooting.md)
- [authentication.md](/Users/taichitakeda/dev/starter/docs/authentication.md)
- [profile.md](/Users/taichitakeda/dev/starter/docs/profile.md)
