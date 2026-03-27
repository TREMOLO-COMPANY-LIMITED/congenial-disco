---
description: Verify local development setup for the current starter project.
allowed-tools: Read, Glob, Bash(node --version), Bash(pnpm --version), Bash(docker --version), Bash(docker compose ps), Bash(ls), Bash(cat), Bash(lsof -i), Bash(pnpm db:generate), Bash(pnpm db:migrate)
---

# Setup Verification

Verify that local development is correctly configured. If something is missing, report the exact fix.

## Step 1: Check prerequisites

```bash
node --version
pnpm --version
docker --version
```

Expected baseline:

- Node.js `>= 20`
- pnpm `>= 10`
- Docker installed

## Step 2: Check dependencies

Confirm the workspace dependencies appear to be installed.

Examples:

```bash
ls node_modules
ls apps/web/node_modules
ls apps/admin/node_modules
```

If dependencies are clearly missing, recommend:

```bash
pnpm install
```

## Step 3: Check environment files

Confirm the presence of the expected local env files:

- `apps/api/.dev.vars`
- `apps/web/.env.local` or at least `apps/web/.env.example`
- `apps/admin/.env.local` or at least `apps/admin/.env.example`
- `packages/db/.env`

Important variables include:

- `DATABASE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_API_URL`

## Step 4: Check Docker services

```bash
docker compose ps
```

Confirm the status of:

- PostgreSQL
- Redis
- Redis REST proxy

## Step 5: Check DB tooling

Run:

```bash
pnpm db:generate
pnpm db:migrate
```

If migrations fail, report the likely root cause rather than masking it.

## Step 6: Check ports

```bash
lsof -i :3000 -i :3001 -i :8787 -i :5432 -i :6379 -i :8079
```

Note any conflicts.

## Output Format

```text
Setup Verification Result
━━━━━━━━━━━━━━━━━━━━━━━━━
✅/❌ Node.js
✅/❌ pnpm
✅/❌ Docker
✅/❌ Dependencies
✅/❌ Env files
✅/❌ PostgreSQL
✅/❌ Redis
✅/❌ Redis REST proxy
✅/❌ DB generate/migrate
✅/❌ Port availability
━━━━━━━━━━━━━━━━━━━━━━━━━
```
