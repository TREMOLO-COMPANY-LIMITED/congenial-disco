## Tech Stack

```
Backend: TypeScript + Hono.js
  - Validation: Zod
  - Auth: Better Auth
  - OpenAPI : @hono/zod-openapi
  - Deploy: Cloudflare Workers

Frontend: Next.js + React (TypeScript)
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
Test: Vitest, React Testing Library, Playwright (E2E)

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

## Coding Conventions (General)

- Language: TypeScript (strict mode)
- Naming: Variables, functions, and classes must be named in English.
- Imports: Use absolute paths (with the `@/` alias)

> Detailed rules are split into `.claude/rules/`:
> - `security.md` — Security rules (always applied)
> - `workflow.md` — Review, commit, and environment startup rules (always applied)
> - `api-backend.md` — Hono API backend rules (applied to `apps/api/**`)
> - `frontend.md` — Next.js frontend rules (applied to `apps/web/**`, `apps/admin/**`)
> - `database.md` — Drizzle database rules (applied to `packages/db/**`)

## Custom Commands

| Command | Purpose | Timing |
|---------|---------|--------|
| `/review` | Self-review (13 quality + security checks) | After completing task implementation |
| `/security-review` | Specialized security review (30 checks for payments and authentication) | Run in a separate session |
| `/commit` | Review-assisted commit (`/review` -> fix -> commit) | When committing |
| `/test` | Smart test execution (automatically determines scope based on changes) | When running tests |
| `/check` | Full pre-PR checks (types, lint, tests, build) | Before creating a PR |
| `/setup` | Environment setup verification | During initial setup |
