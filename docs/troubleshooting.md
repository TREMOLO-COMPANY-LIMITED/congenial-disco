# Troubleshooting

This document covers common local-development issues for the current `starter` project setup:
`apps/web`, `apps/admin`, `apps/api`, `packages/db`, Docker Compose, Drizzle, and Better Auth.

## Quick Checks First

These are the main local ports:

| Service | Port | Notes |
|------|------|------|
| Web (`apps/web`) | `3000` | Next.js |
| Admin (`apps/admin`) | `3001` | Next.js |
| API (`apps/api`) | `8787` | Wrangler dev |
| PostgreSQL | `5432` | Docker Compose |
| Redis | `6379` | Docker Compose |
| Redis REST proxy | `8079` | Upstash-compatible proxy |

Useful first-pass checks:

```bash
pnpm --version
node --version
docker compose ps
lsof -i :3000 -i :3001 -i :8787 -i :5432 -i :6379 -i :8079
```

## Environment Variables

### Symptoms

- API startup fails with connection or auth-related errors
- `/verify/*` returns `not configured`
- Drizzle migration commands fail

### Resolution

This project uses separate environment files by concern.

| File | Purpose |
|------|---------|
| `.env.example` | full project sample |
| `apps/api/.dev.vars.example` | Wrangler local variables for the API |
| `apps/web/.env.example` | Web app sample |
| `apps/admin/.env.example` | Admin app sample |
| `packages/db/.env.example` | Drizzle sample |

Create the missing files from the examples:

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp packages/db/.env.example packages/db/.env
```

Minimum local values:

```dotenv
# apps/api/.dev.vars
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starter
UPSTASH_REDIS_REST_URL=http://localhost:8079
UPSTASH_REDIS_REST_TOKEN=local-dev-token
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:8787
```

```dotenv
# apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8787
```

```dotenv
# apps/admin/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8787
```

```dotenv
# packages/db/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starter
```

## Port Conflicts

### Symptoms

- `pnpm dev` fails because a port is already in use
- `pnpm --filter @starter/api dev` fails to start
- Playwright collides with an already-running local server

### Resolution

```bash
lsof -i :3000
lsof -i :3001
lsof -i :8787

kill -9 <PID>

lsof -ti :3000,:3001,:8787 | xargs kill -9
```

Also check local infrastructure ports:

```bash
lsof -i :5432
lsof -i :6379
lsof -i :8079
```

## Docker and Local Infrastructure

### PostgreSQL or Redis does not start

```bash
docker compose ps
docker compose logs postgres
docker compose logs redis
docker compose logs redis-rest
```

Recreate the containers:

```bash
docker compose down
docker compose up -d
```

Reset everything including volumes:

```bash
docker compose down -v
docker compose up -d
```

`down -v` deletes local PostgreSQL and Redis data. Use it only for development resets.

### Docker Desktop is not running

```bash
docker info
open -a Docker
```

Then retry:

```bash
docker compose up -d
```

## Database Issues

### Migrations fail

First confirm that `DATABASE_URL` is correct in both `packages/db/.env` and `apps/api/.dev.vars`.

```bash
pnpm db:migrate
```

Package-level commands:

```bash
pnpm --filter @starter/db db:migrate
pnpm --filter @starter/db db:generate
pnpm --filter @starter/db db:studio
```

If it still fails, inspect PostgreSQL directly:

```bash
docker compose ps postgres
docker compose logs postgres
```

### API cannot connect to the database

Use the verification endpoints:

```bash
curl http://localhost:8787/verify/db
curl http://localhost:8787/verify/all
```

If you get `DATABASE_URL is not configured`, check `apps/api/.dev.vars`.

### Admin seeding fails

`db:seed-admin` requires `ADMIN_EMAIL` and `DATABASE_URL`.

```bash
ADMIN_EMAIL=admin@example.com \
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starter \
pnpm --filter @starter/db db:seed-admin
```

## Redis Issues

### Cannot connect to Redis

The API uses the Upstash-style REST endpoint, not a raw Redis socket directly.

```bash
docker compose ps redis redis-rest
docker compose logs redis
docker compose logs redis-rest
curl -H "Authorization: Bearer local-dev-token" http://localhost:8079/ping
curl http://localhost:8787/verify/redis
```

If you see `UPSTASH_REDIS_REST_URL or TOKEN is not configured`, fix `apps/api/.dev.vars`.

### Reset Redis locally

```bash
docker compose exec redis redis-cli FLUSHALL
```

Only use this when you intentionally want to clear development data.

## Better Auth and Authentication

### Sign-up or login fails

Check the basics in this order:

```bash
curl http://localhost:8787/health
curl http://localhost:8787/api/auth/session
```

Then verify:

- `BETTER_AUTH_SECRET` exists in `apps/api/.dev.vars`
- `BETTER_AUTH_URL` is `http://localhost:8787`
- `NEXT_PUBLIC_API_URL` is set in both `apps/web/.env.local` and `apps/admin/.env.local`
- `WEB_URL` and `ADMIN_URL` in `apps/api/wrangler.toml` match the actual frontend origins

### Email verification does not work

Better Auth email delivery requires `RESEND_API_KEY`.

```bash
curl http://localhost:8787/verify/resend
```

Set `RESEND_API_KEY` in `apps/api/.dev.vars` for local email delivery tests.

## Cloudflare R2

### Image upload fails

Check these variables:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` when public URL generation is required

Verification:

```bash
curl http://localhost:8787/verify/r2
```

Relevant page:

- Web: `http://localhost:3000/profile`

Common causes:

- missing R2 credentials in `apps/api/.dev.vars`
- missing bucket CORS entry for `http://localhost:3000`
- `Content-Type` mismatch between presign step and actual upload

## Sentry

### Sentry verification fails

```bash
curl http://localhost:8787/verify/sentry
```

If `SENTRY_DSN` is not configured, failure is expected. That can be ignored locally if Sentry is not needed.

## Build and Type Checking

### TypeScript errors appear

```bash
pnpm test
pnpm build
pnpm lint
```

Run packages individually if needed:

```bash
pnpm --filter @starter/api test
pnpm --filter @starter/web test
pnpm --filter @starter/admin test
```

### `.next` or local build output seems corrupted

```bash
pnpm clean
pnpm install
```

Per app:

```bash
pnpm --filter @starter/web clean
pnpm --filter @starter/admin clean
pnpm --filter @starter/api clean
```

### Turborepo cache looks stale

```bash
pnpm exec turbo clean
pnpm build
```

## Frontend Issues

### Web or Admin cannot reach the API

The most common cause is a bad `NEXT_PUBLIC_API_URL`.

```bash
cat apps/web/.env.local
cat apps/admin/.env.local
curl http://localhost:8787/health
```

Expected:

- `apps/web/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8787`
- `apps/admin/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:8787`
- `http://localhost:8787/health` responds successfully

### Hot reload stops working

```bash
pnpm --filter @starter/web clean
pnpm --filter @starter/admin clean
```

Then restart:

```bash
pnpm --filter @starter/web dev
pnpm --filter @starter/admin dev
```

## Test Issues

### Vitest fails

This repository uses Vitest for unit and component tests.

```bash
pnpm test
pnpm --filter @starter/api test
pnpm --filter @starter/web test
pnpm --filter @starter/admin test
```

If tests still fail, also verify environment variables and package build state.

### Playwright E2E fails

E2E tests live in `e2e/`.
The Playwright config starts:

- API: `http://localhost:8787`
- Web: `http://localhost:3000`

Run:

```bash
pnpm --filter @starter/e2e e2e
```

UI mode:

```bash
pnpm --filter @starter/e2e e2e:ui
```

Check:

- `apps/api/.dev.vars` exists
- `apps/web/.env.local` contains `NEXT_PUBLIC_API_URL`
- ports `3000` and `8787` are free

## Dependency Corruption

### `node_modules` appears broken

```bash
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

If DB-related packages are involved:

```bash
pnpm db:generate
```

## If It Still Fails

These commands produce useful debugging context:

```bash
node --version
pnpm --version
docker compose ps
pnpm build
pnpm test
curl http://localhost:8787/verify/all
```

When sharing the problem, include:

- the exact command you ran
- the full error message
- which app failed: `web`, `admin`, `api`, `e2e`, or `db`
- which env values or files are missing
