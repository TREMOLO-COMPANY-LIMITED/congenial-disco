## Tech Stack

```
Backend: TypeScript + Hono.js
  - Validation: Zod
  - Auth: Better Auth
  - OpenAPI : @hono/zod-openapi
  - Deploy: Cloudflare Workers

Frondend: Next.js + React（TypeScript）
  - UI Components: shadcn/ui
  - Data Fetch: TanStack Query
  - Form: React Hook Form + zod
  - Auth: Better Auth 
  - State management: Zustand(global)
  - Icon: Lucide React
  - Deploy: Vercel


Database: Supabase PostgreSQL (via Pooler) + Drizzle
Cache: Upstashe Redis
Mono repo: Turborepo + pnpm
Test: Vitest, React Testing Library, Playwright（E2E）

Storage: Cloudflare R2
Monitoring: Sentry
Logging: Axiom
Email notification: Resend
```

## Directory Structure

```
starter/
├── apps/
│   ├── api/                        # Backend — Hono.js on Cloudflare Workers
│   │   ├── src/
│   │   │   ├── index.ts            # App entry point (OpenAPIHono)
│   │   │   ├── routes/             # Route handlers
│   │   │   └── lib/                # Server-side utilities (auth, etc.)
│   │   ├── wrangler.toml           # Cloudflare Workers config
│   │   └── tsconfig.json
│   │
│   └── web/                        # Frontend — Next.js (App Router)
│       ├── src/
│       │   ├── app/                # Next.js App Router pages & layouts
│       │   └── lib/                # Client-side utilities (api client, auth, etc.)
│       ├── next.config.ts
│       ├── postcss.config.mjs
│       └── tsconfig.json
│
├── packages/
│   ├── typescript-config/          # Shared tsconfig presets (base, nextjs, hono)
│   ├── eslint-config/              # Shared ESLint configuration
│   ├── shared/                     # Shared Zod schemas, types, and utilities
│   │   └── src/
│   │       ├── types/
│   │       └── utils/
│   ├── db/                         # Drizzle ORM schema, client, and migrations
│   │   └── src/
│   │       ├── client.ts
│   │       └── schema/
│   └── ui/                         # Shared UI components (shadcn/ui style)
│       └── src/
│           └── components/
│
├── package.json                    # Workspace root
├── pnpm-workspace.yaml
├── turbo.json                      # Turborepo task pipeline
└── tsconfig.json                   # Root TypeScript config
```