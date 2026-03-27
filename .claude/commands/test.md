---
description: Run the smallest useful test scope based on the changed files in this repository.
allowed-tools: Read, Glob, Grep, Bash(git diff --name-only), Bash(git status), Bash(pnpm test), Bash(pnpm --filter)
---

# Smart Test Runner

## Step 1: Identify changed files

Run:

```bash
git diff --name-only HEAD
git status --short
```

Use the changed paths to decide the smallest useful test scope.

## Step 2: Choose the scope

Follow these rules.

### API changes

If files under `apps/api/` changed:

- prefer `pnpm --filter @starter/api test`
- if route tests are clearly affected, mention the impacted test files

### Web changes

If files under `apps/web/` changed:

- prefer `pnpm --filter @starter/web test`

### Admin changes

If files under `apps/admin/` changed:

- prefer `pnpm --filter @starter/admin test`

### Shared package changes

If files under `packages/shared/` changed:

- run `pnpm --filter @starter/shared test`
- also run dependent app/package tests if the shared change affects runtime behavior broadly

### DB schema changes

If files under `packages/db/` changed:

- run at least `pnpm --filter @starter/api test`
- consider `pnpm test` if the schema change is broad

### Cross-cutting changes

If multiple apps/packages changed or impact is unclear:

- run `pnpm test`

## Step 3: Execute tests

If `$ARGUMENTS` is provided, honor it when practical.

Examples:

```bash
pnpm --filter @starter/api test
pnpm --filter @starter/web test
pnpm --filter @starter/admin test
pnpm --filter @starter/shared test
pnpm test
```

## Step 4: Report the result

Use one of these outcomes:

- `All selected tests passed`
- `Tests failed: <where and why>`
- `No direct tests found for the changed files; additional coverage may be needed`
