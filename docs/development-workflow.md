# Development Workflow

This document describes the day-to-day workflow for the current `starter` monorepo:
`apps/web`, `apps/admin`, `apps/api`, and `packages/*`.

## End-to-End Flow

1. Create a topic branch.
2. Prepare local services and environment variables.
3. Start the target app or the full stack.
4. Implement changes and update tests at the same time.
5. Run lint, tests, and build checks.
6. Review the diff and commit.
7. Push the branch and open a PR.

## 1. Create a Branch

Start each task from a topic branch.

```bash
git checkout -b <type>/<short-description>
```

Examples:

```bash
git checkout -b feat/email-verification
git checkout -b fix/admin-auth-redirect
git checkout -b docs/update-troubleshooting
```

Common prefixes:

- `feat` - feature work
- `fix` - bug fixes
- `docs` - documentation updates
- `refactor` - code cleanup without intended behavior changes
- `test` - test additions or test fixes
- `chore` - maintenance work

## 2. Prepare the Local Environment

### Install dependencies

```bash
pnpm install
```

### Create environment files

Copy the examples when needed.

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
cp packages/db/.env.example packages/db/.env
```

### Start local DB and Redis

```bash
pnpm db:start
```

For initial setup with migrations:

```bash
pnpm db:setup
```

To stop local services:

```bash
pnpm db:stop
```

## 3. Start the Apps

### Start everything

```bash
pnpm dev
```

Typical local URLs:

| Service | URL |
|------|-----|
| Web | `http://localhost:3000` |
| Admin | `http://localhost:3001` |
| API | `http://localhost:8787` |

### Start individual apps

```bash
pnpm --filter @starter/web dev
pnpm --filter @starter/admin dev
pnpm --filter @starter/api dev
```

### Verify the environment

```bash
curl http://localhost:8787/health
curl http://localhost:8787/verify/all
```

`/verify/all` provides a combined report for DB, Redis, R2, Resend, and Sentry.

## 4. Implement Changes

### Know the target layer

| Goal | Main location |
|------|---------------|
| API, auth, verification routes | `apps/api/src/` |
| Web UI | `apps/web/src/` |
| Admin UI | `apps/admin/src/` |
| DB schema and migrations | `packages/db/` |
| Shared types and schemas | `packages/shared/src/` |
| Shared UI components | `packages/ui/src/` |

### Write tests with the implementation

Current test stack:

- API: Vitest
- Web/Admin: Vitest + Testing Library
- E2E: Playwright

Do not postpone tests until the end if the behavior is changing.

## 5. Database Changes

This project uses Drizzle, not Prisma.

### When updating schema

1. Update `packages/db/src/schema/`.
2. Generate SQL.
3. Apply migrations.
4. Update dependent code and tests as needed.

Commands:

```bash
pnpm db:generate
pnpm db:migrate
```

Package-level commands:

```bash
pnpm --filter @starter/db db:generate
pnpm --filter @starter/db db:migrate
pnpm --filter @starter/db db:studio
```

If you need to grant admin privileges:

```bash
ADMIN_EMAIL=admin@example.com \
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/starter \
pnpm --filter @starter/db db:seed-admin
```

## 6. Tests and Quality Checks

### Recommended order

```bash
pnpm lint
pnpm test
pnpm build
```

### Package-specific checks

```bash
pnpm --filter @starter/api test
pnpm --filter @starter/web test
pnpm --filter @starter/admin test
```

### E2E tests

```bash
pnpm --filter @starter/e2e e2e
```

Playwright starts `apps/api` and `apps/web` automatically. Make sure ports `3000` and `8787` are free and the required env files exist first.

## 7. Review the Diff

Before committing, at minimum run:

```bash
git status
git diff -- docs/
git diff
```

Review checklist:

- no unintended files are included
- no `.env`, `.env.local`, `.dev.vars`, or secrets are staged
- no generated artifacts or noise were added accidentally
- docs still match the code after the change

## 8. Commit

Use a short English subject, ideally close to Conventional Commits.

```bash
git add .
git commit -m "feat(api): add verify endpoint"
```

Examples:

```bash
git commit -m "fix(web): handle missing avatar url"
git commit -m "docs: update development workflow"
git commit -m "test(admin): cover login redirect"
```

## 9. Push and Open a PR

```bash
git push -u origin <branch-name>
gh pr create
```

Before opening the PR, rerun these checks when possible:

```bash
pnpm lint
pnpm test
pnpm build
```

## Frequently Used Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm clean
pnpm db:start
pnpm db:stop
pnpm db:setup
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Practical Shortcuts by Change Type

### API-only work

```bash
pnpm db:start
pnpm --filter @starter/api dev
pnpm --filter @starter/api test
```

### Web-only work

```bash
pnpm --filter @starter/web dev
pnpm --filter @starter/web test
```

### Admin-only work

```bash
pnpm --filter @starter/admin dev
pnpm --filter @starter/admin test
```

### Full-stack work

```bash
pnpm db:start
pnpm dev
pnpm test
pnpm build
```

## Related Documents

- `docs/architecture.md` - system overview
- `docs/authentication.md` - Better Auth flow
- `docs/profile.md` - profile image upload flow
- `docs/troubleshooting.md` - common issue resolution
