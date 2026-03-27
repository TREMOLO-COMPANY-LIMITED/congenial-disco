---
paths:
  - "packages/db/**"
---

# Database Rules

## Stack Assumptions

- ORM: Drizzle
- Database: PostgreSQL
- Migrations: generated under `packages/db/drizzle/`

## Naming

- Table names: `snake_case`
- Column names: `snake_case`
- TypeScript exports: `camelCase` or `PascalCase` following existing code style

## Schema Design

- Keep `created_at` / `updated_at` style audit fields where the current schema pattern already expects them
- Prefer explicit references and deletion behavior
- Match auth-related schema changes with Better Auth expectations
- Keep defaults and nullability intentional; do not rely on accidental implicit behavior

## When the Schema Changes

If files under `packages/db/src/schema/` change, also review:

1. generated migrations under `packages/db/drizzle/`
2. shared types in `packages/shared/src/types/`
3. API route responses and request handling in `apps/api/src/`
4. tests affected by the schema update
5. seed scripts such as `packages/db/src/seed-admin.ts`
6. docs that describe the schema or architecture

## Commands

Use the current project commands:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Safety

- Do not change schema and forget the migration output
- Do not add fields that expose secrets or credentials in application responses
- Review role, banned status, and auth-related fields carefully because they affect authorization behavior
