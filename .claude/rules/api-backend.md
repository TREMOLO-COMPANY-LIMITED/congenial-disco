---
paths:
  - "apps/api/**"
---

# API Backend Rules

## Stack Assumptions

- Backend framework: Hono with `@hono/zod-openapi`
- Auth: Better Auth
- Database access: Drizzle via `@starter/db`
- Shared contracts: `@starter/shared`

## Structure

- Keep route definitions under `apps/api/src/routes/`
- Put reusable service or integration setup in `apps/api/src/lib/`
- Keep route handlers thin when logic can be extracted cleanly
- Group feature-specific routes by directory when they have multiple files, for example `verify/`, `upload/`, `admin/`

## Validation and Contracts

- Prefer shared Zod schemas and shared types where cross-app contracts exist
- Keep request and response shapes aligned with `@starter/shared` when they are consumed by frontend apps
- Use OpenAPI route definitions consistently for typed endpoints
- Do not introduce parallel DTO systems unless there is a clear need

## Auth and Authorization

- Use Better Auth session-based flows consistently
- Protect admin routes with the existing admin middleware pattern
- Make authorization explicit at the route boundary
- Do not trust user-provided IDs without checking ownership or role requirements

## Error Handling

- Fail external integrations safely: DB, Redis, R2, Resend, Sentry
- Return predictable HTTP errors instead of leaking raw internals
- Keep configuration errors explicit, for example missing env vars should produce clear messages

## Testing

- Add or update API tests when route behavior changes
- Prefer route-level tests for route behavior and response contracts
- Cover both success and failure paths for integration-heavy endpoints
