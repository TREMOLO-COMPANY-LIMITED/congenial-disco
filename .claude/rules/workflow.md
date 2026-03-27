# Workflow Rules

## Standard Flow

```text
implement -> review -> test -> commit -> push -> PR
```

## Expectations

- keep one task focused on one coherent change
- follow the existing repository structure and naming
- write or update tests when behavior changes
- run a self-review before considering the task complete
- update docs when setup, workflow, architecture, or behavior changes

## Commit Guidance

Preferred format:

```text
type(scope): description
```

- description should be in English
- start lowercase when practical
- keep commits focused and understandable

Suggested scopes for this repo:

- `api`
- `web`
- `admin`
- `db`
- `shared`
- `ui`
- `docs`
- `e2e`

## Before Opening a PR

Run the current baseline checks when relevant:

```bash
pnpm lint
pnpm test
pnpm build
```

If the change touches schema or environment-sensitive code, also verify the affected paths more directly.

## Local Startup

For the current repository, the typical local startup flow is:

1. `docker compose up -d`
2. `pnpm db:migrate`
3. `pnpm dev`

Expected local URLs:

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`
- API: `http://localhost:8787`

## Review-Sensitive Areas

Be extra careful with:

- auth flows
- admin permissions
- DB schema changes
- uploads and R2 handling
- environment-variable-driven integrations
