---
description: Synchronize follow-up files after Drizzle schema changes in this repository.
allowed-tools: Read, Glob, Grep, Bash(git diff), Bash(git status), Bash(pnpm db:generate), Bash(pnpm db:migrate), Bash(pnpm --filter)
---

# DB Schema Sync

Use this command when files under `packages/db/src/schema/` have changed.

## Step 1: Review the schema diff

Inspect the changed schema files and identify:

- added or removed tables
- added or removed columns
- changed defaults, nullability, or references
- new role/status fields that affect shared types or API responses

Use:

```bash
git diff -- packages/db/src/schema
```

## Step 2: Generate or update migrations

Use `$ARGUMENTS` as the migration name if provided. Otherwise derive a short descriptive name.

Run:

```bash
pnpm db:generate
pnpm db:migrate
```

If package-level execution is needed:

```bash
pnpm --filter @starter/db db:generate
pnpm --filter @starter/db db:migrate
```

## Step 3: Update dependent code

Check whether the schema change requires updates in:

- `packages/shared/src/types/`
- API route response shapes under `apps/api/src/routes/`
- frontend consumers in `apps/web` or `apps/admin`
- tests in `packages/shared/src/__tests__/`, `apps/api/src/routes/__tests__/`, or app test files
- seed logic such as `packages/db/src/seed-admin.ts`
- docs such as `docs/architecture.md` or feature docs

## Step 4: Verify the result

Run the checks most relevant to the schema change:

```bash
pnpm test
pnpm build
```

Or package-level checks if the change is tightly scoped:

```bash
pnpm --filter @starter/api test
pnpm --filter @starter/web test
pnpm --filter @starter/admin test
```

## Output Format

```text
DB Sync Result
━━━━━━━━━━━━━━━━━━━
✅/❌ Schema diff reviewed
✅/❌ Migration generated
✅/❌ Migration applied
✅/❌ Dependent types/routes updated
✅/❌ Tests/docs updated
✅/❌ Verification checks passed
━━━━━━━━━━━━━━━━━━━
```
