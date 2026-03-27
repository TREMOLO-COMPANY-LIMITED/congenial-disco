# Admin Dashboard Design

## Overview

Add an administrator dashboard with user-management capabilities as a separate Next.js app, `apps/admin`, within the existing monorepo. The API should remain shared by extending the existing `apps/api` application with admin-specific endpoints.

## Requirements

- fully separated from the user-facing app (`apps/web`)
- same core stack as the web app: Next.js, shadcn/ui, TanStack Query, Better Auth
- add a role column to the users table: `user` / `admin` / `super_admin`
- only users with admin privileges can access the dashboard
- initial scope is limited to user management: list, detail, role changes, suspend/activate

## Architecture

### Approach

Add `apps/admin` as an independent Next.js app and add admin routes to the existing `apps/api`.

Reasons for this approach:

- complete separation from the user app for deployment and change management
- reuse existing shared packages: `@starter/ui`, `@starter/shared`, `@starter/db`
- natural fit for the existing Turborepo workspace layout
- share Better Auth rather than introducing duplicate auth infrastructure

Alternatives rejected:

- adding admin routes inside `apps/web` with a route group
  This conflicts with the separation requirement.
- creating a separate admin-only API app
  This is unnecessary complexity at the current stage.

## Database Changes

### Add `role` to the `users` table

```sql
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
```

Drizzle schema:

```typescript
role: text("role").notNull().default("user"), // "user" | "admin" | "super_admin"
```

- type: `text`
- required with default value `'user'`
- allowed values: `user`, `admin`, `super_admin`
- existing users default to `user`
- added through a Drizzle migration

### Enable `banned` on the `users` table

Use Better Auth's `banned` field for suspend/activate behavior.

Drizzle schema:

```typescript
banned: boolean("banned"),
bannedReason: text("banned_reason"),
```

### Bootstrap the initial `super_admin`

The first `super_admin` should be created through a DB migration or a seed script:

```sql
UPDATE users SET role = 'super_admin' WHERE email = '<admin-email>';
```

Provide a seed script in `packages/db` (`seed-admin.ts`) using the `ADMIN_EMAIL` environment variable.

## API Design

### Admin route structure

```text
apps/api/src/routes/admin/
  ├── middleware.ts    # role-check middleware
  └── users.ts         # user management endpoints
```

### Middleware (`middleware.ts`)

1. Read the session with `auth.api.getSession()`. Return 401 when unauthenticated.
2. Load the user's `role` from the DB using the session `userId`.
3. Return 403 unless the role is `admin` or `super_admin`.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/me` | Check the role of the authenticated user |
| GET | `/api/admin/users` | List users with pagination and search |
| GET | `/api/admin/users/:id` | Get user details |
| PATCH | `/api/admin/users/:id/role` | Change a user's role, only for `super_admin` |
| PATCH | `/api/admin/users/:id/status` | Suspend or activate an account |

### Permission hierarchy rules

- `admin`: can view the user list and details, and suspend/activate accounts
- `super_admin`: can do all of the above and can change roles
- users cannot change their own role or ban themselves to avoid removing the last `super_admin`

Validation:

- define request and response schemas in `@starter/shared`
- keep them type-safe with Zod
- expose them through OpenAPI via `@hono/zod-openapi`

## Frontend: `apps/admin`

### Tech stack

Same baseline as `apps/web`:

- Next.js 15 (App Router, Turbopack)
- shadcn/ui via `@starter/ui`
- TanStack Query
- Better Auth client
- Tailwind CSS

### Directory structure

```text
apps/admin/
  ├── src/
  │   ├── app/
  │   │   ├── layout.tsx            # root layout with Providers
  │   │   ├── page.tsx              # redirect / to /login
  │   │   ├── login/
  │   │   │   └── page.tsx          # admin login page
  │   │   └── (dashboard)/
  │   │       ├── layout.tsx        # auth + role-check guarded layout
  │   │       ├── dashboard/
  │   │       │   └── page.tsx      # dashboard home, future stats area
  │   │       └── users/
  │   │           ├── page.tsx      # user list
  │   │           └── [id]/
  │   │               └── page.tsx  # user detail and edit
  │   ├── lib/
  │   │   ├── auth-client.ts        # Better Auth client
  │   │   └── api.ts                # API client and TanStack Query helpers
  │   └── components/
  │       ├── sidebar.tsx           # side navigation
  │       └── providers.tsx         # QueryClientProvider
  ├── next.config.ts
  ├── package.json
  └── tsconfig.json
```

### Authentication flow

1. Log in on `/login` using Better Auth email/password.
2. After login succeeds, call `GET /api/admin/me` to verify the role.
3. If the role is not `admin` or `super_admin`, show an error and clear the session.
4. In the `(dashboard)` layout, call `/api/admin/me` on each entry to enforce the guard.

### Shared package usage

- `@starter/ui`: UI components such as Button, Card, Input, Badge, and Table
- `@starter/shared`: Zod schemas for roles and admin API request/response contracts
- `@starter/db`: not used directly by the frontend; all access goes through the API

## Deployment

- deploy `apps/admin` to Vercel as a separate project from `apps/web`
- update API CORS configuration in two places:
  1. add the admin app URL to the `origin` list in `apps/api/src/index.ts`
  2. add the admin app URL to `trustedOrigins` in `apps/api/src/lib/auth.ts`
- add `ADMIN_URL` to `wrangler.toml`
- add `ADMIN_URL` to the `Bindings` type in `apps/api/src/types.ts`

## Shared Schema Additions (`@starter/shared`)

```typescript
export const userRoleSchema = z.enum(["user", "admin", "super_admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});

export const adminUserUpdateRoleSchema = z.object({
  role: userRoleSchema,
});

export const adminUserUpdateStatusSchema = z.object({
  banned: z.boolean(),
  bannedReason: z.string().optional(),
});

export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: userRoleSchema,
  banned: z.boolean().nullable(),
  bannedReason: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});

export const adminUserListResponseSchema = z.object({
  data: z.array(adminUserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
```

## Future Considerations

Out of scope for the initial version:

- audit logs for admin actions
- rate limiting using Upstash Redis
- dashboard analytics such as registration trends and active-user counts
