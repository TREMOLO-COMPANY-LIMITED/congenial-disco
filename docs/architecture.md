# Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Monorepo (Turborepo + pnpm)               │
│                                                                  │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐  │
│  │   apps/web (Frontend)   │    │    apps/api (Backend)       │  │
│  │   Next.js 15 (App Router)│    │    Hono.js on CF Workers   │  │
│  │   Port: 3000            │───▶│    Port: 8787              │  │
│  │   Deploy: Vercel        │    │    Deploy: Cloudflare       │  │
│  └─────────────────────────┘    └──────────┬──────────────────┘  │
│                                            │                     │
│  ┌──────────────────────────────────────────┼──────────────────┐  │
│  │              Shared Packages             │                  │  │
│  │  ┌────────┐ ┌────────┐ ┌─────┐ ┌──────┐│                  │  │
│  │  │  db    │ │ shared │ │ ui  │ │config││                  │  │
│  │  │Drizzle │ │  Zod   │ │shad-│ │TS/ES ││                  │  │
│  │  │ ORM   │ │schemas │ │cn/ui│ │ lint ││                  │  │
│  │  └────────┘ └────────┘ └─────┘ └──────┘│                  │  │
│  └──────────────────────────────────────────┘                  │  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  PostgreSQL   │  │ Upstash Redis│  │ Cloudflare R2│
     │  (Supabase)   │  │   (Cache)    │  │  (Storage)   │
     └──────────────┘  └──────────────┘  └──────────────┘
```

## Tech Stack

| Layer          | Technology                              | Purpose                     |
| -------------- | --------------------------------------- | --------------------------- |
| Frontend       | Next.js 15 (App Router) + React 19      | Web application             |
| UI Components  | shadcn/ui + Tailwind CSS 4              | Design system               |
| Data Fetching  | TanStack Query 5                        | Server state management     |
| Forms          | React Hook Form + Zod                   | Client-side form validation |
| State          | Zustand 5                               | Global client state         |
| Icons          | Lucide React                            | Icon library                |
| Backend        | Hono.js + @hono/zod-openapi             | REST API with OpenAPI docs  |
| Auth           | Better Auth                             | Authentication (email/pass) |
| ORM            | Drizzle ORM                             | Type-safe database access   |
| Database       | Supabase PostgreSQL (via Pooler)        | Primary data store          |
| Cache          | Upstash Redis                           | Caching layer               |
| Object Storage | Cloudflare R2                           | File/blob storage           |
| Email          | Resend                                  | Transactional emails        |
| Monitoring     | Sentry                                  | Error tracking              |
| Build          | Turborepo + pnpm                        | Monorepo orchestration      |
| Testing        | Vitest, React Testing Library, Playwright | Unit, integration, E2E     |

## Directory Structure

```
starter/
├── apps/
│   ├── api/                          # Hono.js backend (Cloudflare Workers)
│   │   ├── src/
│   │   │   ├── index.ts              # OpenAPIHono entry point
│   │   │   ├── types.ts              # Cloudflare env bindings
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts           # /api/auth/* (Better Auth)
│   │   │   │   └── verify/           # /verify/* diagnostic endpoints
│   │   │   └── lib/
│   │   │       └── auth.ts           # Better Auth instance factory
│   │   ├── wrangler.toml
│   │   └── vitest.config.ts
│   │
│   └── web/                          # Next.js frontend (Vercel)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx        # Root layout + Providers
│       │   │   ├── page.tsx          # Home (API health display)
│       │   │   ├── providers.tsx     # TanStack Query provider
│       │   │   └── verify/page.tsx   # Service verification dashboard
│       │   └── lib/
│       │       ├── api.ts            # fetchApi() wrapper
│       │       ├── auth-client.ts    # Better Auth React client
│       │       └── stores/           # Zustand stores
│       └── vitest.config.ts
│
├── packages/
│   ├── db/                           # Drizzle ORM schema & client
│   │   └── src/
│   │       ├── index.ts              # createDb() factory + exports
│   │       └── schema/index.ts       # users, sessions, accounts, verifications
│   ├── shared/                       # Shared Zod schemas & types
│   │   └── src/types/index.ts        # healthResponse, verifyItem, verifyResponse
│   ├── ui/                           # shadcn/ui components
│   │   └── src/components/           # Button, Card, Badge, Input, Label
│   ├── typescript-config/            # Shared tsconfig presets
│   └── eslint-config/                # Shared ESLint rules
│
├── e2e/                              # Playwright E2E tests
├── docker-compose.yml                # Local PostgreSQL + Redis
├── turbo.json                        # Build pipeline
└── pnpm-workspace.yaml
```

## Package Dependency Graph

```
apps/web ──────▶ @starter/shared (Zod schemas)
    │──────────▶ @starter/ui (UI components)
    │
apps/api ──────▶ @starter/shared (Zod schemas)
    │──────────▶ @starter/db (Drizzle ORM)
    │
e2e ───────────▶ apps/web + apps/api (runs both as webServers)
```

## API Routes

| Method   | Path                | Description                        |
| -------- | ------------------- | ---------------------------------- |
| GET      | `/health`           | Health check (status + timestamp)  |
| GET      | `/verify/db`        | PostgreSQL connectivity test       |
| GET      | `/verify/redis`     | Upstash Redis SET/GET/DEL test     |
| GET      | `/verify/r2`        | Cloudflare R2 bucket access test   |
| GET      | `/verify/resend`    | Resend API key validation          |
| GET      | `/verify/sentry`    | Sentry DSN test (sends ping)       |
| GET      | `/verify/all`       | All verification checks in parallel|
| ALL      | `/api/auth/*`       | Better Auth handler (login, signup, session) |
| GET      | `/doc`              | OpenAPI documentation              |

## Database Schema

```
┌───────────────┐       ┌───────────────┐
│    users      │       │   sessions    │
├───────────────┤       ├───────────────┤
│ id (UUID PK)  │◀──┐   │ id (UUID PK)  │
│ email (unique)│   │   │ userId (FK)   │──▶ users.id
│ name          │   │   │ token (unique)│
│ image         │   │   │ expiresAt     │
│ emailVerified │   │   │ ipAddress     │
│ createdAt     │   │   │ userAgent     │
│ updatedAt     │   │   │ createdAt     │
└───────────────┘   │   │ updatedAt     │
                    │   └───────────────┘
                    │
                    │   ┌───────────────┐
                    │   │   accounts    │
                    │   ├───────────────┤
                    └───│ userId (FK)   │
                        │ id (UUID PK)  │
                        │ accountId     │
                        │ providerId    │
                        │ accessToken   │
                        │ refreshToken  │
                        │ password      │
                        └───────────────┘

┌───────────────────┐
│  verifications    │
├───────────────────┤
│ id (UUID PK)      │
│ identifier        │
│ value             │
│ expiresAt         │
│ createdAt         │
│ updatedAt         │
└───────────────────┘
```

## Authentication Flow

```
┌────────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Browser   │     │  Next.js    │     │  Hono API    │     │ PostgreSQL │
│  (Client)  │     │  (Frontend) │     │  (Backend)   │     │ (Supabase) │
└─────┬──────┘     └──────┬──────┘     └──────┬───────┘     └─────┬──────┘
      │                   │                   │                   │
      │  authClient.signUp()                  │                   │
      │──────────────────▶│                   │                   │
      │                   │  POST /api/auth/sign-up               │
      │                   │──────────────────▶│                   │
      │                   │                   │  INSERT user      │
      │                   │                   │──────────────────▶│
      │                   │                   │  INSERT session   │
      │                   │                   │──────────────────▶│
      │                   │                   │◀──────────────────│
      │                   │  Set-Cookie (session token)           │
      │                   │◀──────────────────│                   │
      │  session cookie   │                   │                   │
      │◀──────────────────│                   │                   │
      │                   │                   │                   │
      │  authClient.signIn()                  │                   │
      │──────────────────▶│                   │                   │
      │                   │  POST /api/auth/sign-in               │
      │                   │──────────────────▶│                   │
      │                   │                   │  SELECT user      │
      │                   │                   │──────────────────▶│
      │                   │                   │  Verify password  │
      │                   │                   │  CREATE session   │
      │                   │                   │──────────────────▶│
      │                   │  Set-Cookie       │◀──────────────────│
      │                   │◀──────────────────│                   │
      │◀──────────────────│                   │                   │
```

## Data Flow (Frontend → Backend)

```
┌──────────────────────────────────────────────────────┐
│                   Frontend (Next.js)                  │
│                                                      │
│  Page Component                                      │
│       │                                              │
│       ▼                                              │
│  TanStack Query (useQuery)                           │
│       │                                              │
│       ▼                                              │
│  fetchApi(path) ── NEXT_PUBLIC_API_URL ──────────┐   │
│                                                  │   │
│  Zustand Store ◀── UI state updates              │   │
│  React Hook Form + Zod ◀── form validation       │   │
└──────────────────────────────────────────────────┼───┘
                                                   │
                                          HTTP/REST│
                                                   ▼
┌──────────────────────────────────────────────────────┐
│                Backend (Hono.js)                      │
│                                                      │
│  OpenAPIHono Router                                  │
│       │                                              │
│       ├── Zod request/response validation            │
│       ├── Better Auth (session middleware)            │
│       │                                              │
│       ▼                                              │
│  Route Handler                                       │
│       │                                              │
│       ├──▶ Drizzle ORM ──▶ PostgreSQL (Supabase)     │
│       ├──▶ Upstash Redis ──▶ Redis (Cache)           │
│       ├──▶ AWS SDK ──▶ Cloudflare R2 (Storage)       │
│       ├──▶ Resend SDK ──▶ Email delivery             │
│       └──▶ Sentry SDK ──▶ Error tracking             │
└──────────────────────────────────────────────────────┘
```

## Local Development

```bash
# Start local services (PostgreSQL + Redis)
pnpm db:setup        # docker-compose up + migrations

# Start all apps
pnpm dev             # Turborepo runs api (8787) + web (3000)

# Run tests
pnpm test            # Vitest (unit/integration)
pnpm e2e             # Playwright (end-to-end)
```

### Local Service Ports

| Service                | Port  |
| ---------------------- | ----- |
| Next.js (web)          | 3000  |
| Hono.js (api)          | 8787  |
| PostgreSQL             | 5432  |
| Redis                  | 6379  |
| Redis HTTP (Serverless)| 8079  |

## Deployment

| App      | Platform           | Notes                                    |
| -------- | ------------------ | ---------------------------------------- |
| Frontend | Vercel             | Next.js App Router, automatic deployment |
| Backend  | Cloudflare Workers | Serverless, edge-distributed, via Wrangler |
| Database | Supabase           | Managed PostgreSQL with connection pooler |
| Cache    | Upstash            | Serverless Redis with REST API           |
| Storage  | Cloudflare R2      | S3-compatible object storage             |
