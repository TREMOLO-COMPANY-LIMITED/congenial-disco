---
description: Show the current git state, local environment status, and a lightweight implementation snapshot for this repository.
allowed-tools: Read, Glob, Grep, Bash(git status), Bash(git log), Bash(git branch), Bash(docker compose ps), Bash(lsof -i), Bash(rg --files)
---

# Project Status

Collect and summarize the current state of the repository.

## Step 1: Git status

Run:

```bash
git branch --show-current
git status --short
git log --oneline -5
```

## Step 2: Environment status

Run:

```bash
docker compose ps
lsof -i :3000 -i :3001 -i :8787 -i :5432 -i :6379 -i :8079
```

Report whether these services appear to be running:

- PostgreSQL
- Redis
- Redis REST proxy
- Web
- Admin
- API

## Step 3: Lightweight implementation scan

Do not rely on a separate tracker document. Inspect the codebase directly.

Check for the presence of these areas:

### API routes

- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/auth.ts`
- `apps/api/src/routes/verify/`
- `apps/api/src/routes/upload/`
- `apps/api/src/routes/admin/`

### Web app pages

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/auth/register/page.tsx`
- `apps/web/src/app/auth/login/page.tsx`
- `apps/web/src/app/auth/verify-email/page.tsx`
- `apps/web/src/app/verify/page.tsx`
- `apps/web/src/app/profile/page.tsx`

### Admin app pages

- `apps/admin/src/app/login/page.tsx`
- `apps/admin/src/app/(dashboard)/dashboard/page.tsx`
- `apps/admin/src/app/(dashboard)/users/page.tsx`
- `apps/admin/src/app/(dashboard)/users/[id]/page.tsx`

### Shared and DB packages

- `packages/shared/src/types/`
- `packages/ui/src/components/`
- `packages/db/src/schema/index.ts`
- `packages/db/src/seed-admin.ts`

### E2E

- `e2e/tests/`

## Output Format

```text
Project Status
━━━━━━━━━━━━━━━━━━━━━━━━━
Branch: <current branch>
Uncommitted files: <count>
Latest commit: <message>

Environment:
  PostgreSQL: ✅/❌
  Redis: ✅/❌
  Redis REST: ✅/❌
  Web (:3000): ✅/❌
  Admin (:3001): ✅/❌
  API (:8787): ✅/❌

Implementation Snapshot:
  API routes: present / partial / missing
  Web app: present / partial / missing
  Admin app: present / partial / missing
  Shared packages: present / partial / missing
  DB package: present / partial / missing
  E2E: present / missing
━━━━━━━━━━━━━━━━━━━━━━━━━
```

If something is missing or partial, list the concrete missing files.
