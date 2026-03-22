# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin dashboard (`apps/admin`) with user management, backed by role-based access control on the existing API.

**Architecture:** New `apps/admin` Next.js app in the monorepo. Database gets `role`, `banned`, `bannedReason` columns on users table. Existing `apps/api` gets admin-only routes guarded by role-checking middleware. Same auth (Better Auth), same shared packages.

**Tech Stack:** Next.js 15, Hono.js, Drizzle ORM, Better Auth, shadcn/ui, TanStack Query, Zod, OpenAPI

**Spec:** `docs/superpowers/specs/2026-03-22-admin-dashboard-design.md`

---

## File Map

### Database (`packages/db`)
- Modify: `packages/db/src/schema/index.ts` — add `role`, `banned`, `bannedReason` columns to `users`
- Create: `packages/db/src/seed-admin.ts` — bootstrap script to set initial super_admin

### Shared Schemas (`packages/shared`)
- Create: `packages/shared/src/types/admin.ts` — role enum, admin API request/response schemas
- Modify: `packages/shared/src/types/index.ts` — re-export admin schemas

### API (`apps/api`)
- Modify: `apps/api/src/types.ts` — add `ADMIN_URL` to `Bindings`
- Modify: `apps/api/wrangler.toml` — add `ADMIN_URL` env var
- Modify: `apps/api/src/index.ts` — add CORS for admin origin, mount admin routes
- Modify: `apps/api/src/lib/auth.ts` — add admin origin to `trustedOrigins`
- Create: `apps/api/src/routes/admin/middleware.ts` — role-checking middleware
- Create: `apps/api/src/routes/admin/me.ts` — GET /api/admin/me
- Create: `apps/api/src/routes/admin/users.ts` — admin user CRUD routes
- Create: `apps/api/src/routes/admin/index.ts` — compose admin routes

### Admin Frontend (`apps/admin`)
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/postcss.config.mjs`
- Create: `apps/admin/src/app/globals.css`
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/page.tsx`
- Create: `apps/admin/src/app/providers.tsx`
- Create: `apps/admin/src/lib/auth-client.ts`
- Create: `apps/admin/src/lib/api.ts`
- Create: `apps/admin/src/app/login/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/layout.tsx`
- Create: `apps/admin/src/app/(dashboard)/dashboard/page.tsx`
- Create: `apps/admin/src/components/sidebar.tsx`
- Create: `apps/admin/src/app/(dashboard)/users/page.tsx`
- Create: `apps/admin/src/app/(dashboard)/users/[id]/page.tsx`

---

## Task 1: Database Schema — Add role, banned, bannedReason to users

**Files:**
- Modify: `packages/db/src/schema/index.ts`

- [ ] **Step 1: Add columns to users table**

In `packages/db/src/schema/index.ts`, add three columns to the `users` pgTable:

```typescript
role: text("role").notNull().default("user"),
banned: boolean("banned"),
bannedReason: text("banned_reason"),
```

Add them after the `image` column, before `emailVerified`.

- [ ] **Step 2: Generate Drizzle migration**

Run: `pnpm --filter @starter/db db:generate`
Expected: New migration file created in `packages/db/drizzle/` adding the columns.

- [ ] **Step 3: Run migration**

Run: `pnpm --filter @starter/db db:migrate`
Expected: Migration applied successfully. Existing rows get `role = 'user'`, `banned = null`, `bannedReason = null`.

- [ ] **Step 4: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add role, banned, bannedReason columns to users table"
```

---

## Task 2: Shared Schemas — Admin Zod schemas

**Files:**
- Create: `packages/shared/src/types/admin.ts`
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Create admin schemas file**

Create `packages/shared/src/types/admin.ts`:

```typescript
import { z } from "zod";

// Role
export const userRoleSchema = z.enum(["user", "admin", "super_admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

// Admin API - Request schemas
export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const adminUserUpdateRoleSchema = z.object({
  role: userRoleSchema,
});
export type AdminUserUpdateRole = z.infer<typeof adminUserUpdateRoleSchema>;

export const adminUserUpdateStatusSchema = z.object({
  banned: z.boolean(),
  bannedReason: z.string().optional(),
});
export type AdminUserUpdateStatus = z.infer<typeof adminUserUpdateStatusSchema>;

// Admin API - Response schemas
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
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserListResponseSchema = z.object({
  data: z.array(adminUserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

export const adminMeResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
});
export type AdminMeResponse = z.infer<typeof adminMeResponseSchema>;
```

- [ ] **Step 2: Export from index**

In `packages/shared/src/types/index.ts`, add at the end:

```typescript
export {
  userRoleSchema,
  adminUserListQuerySchema,
  adminUserUpdateRoleSchema,
  adminUserUpdateStatusSchema,
  adminUserSchema,
  adminUserListResponseSchema,
  adminMeResponseSchema,
  type UserRole,
  type AdminUserListQuery,
  type AdminUserUpdateRole,
  type AdminUserUpdateStatus,
  type AdminUser,
  type AdminUserListResponse,
  type AdminMeResponse,
} from "./admin";
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter @starter/shared lint`
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add admin Zod schemas for role, user management API"
```

---

## Task 3: API — CORS and Bindings for admin origin

**Files:**
- Modify: `apps/api/src/types.ts`
- Modify: `apps/api/wrangler.toml`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/src/lib/auth.ts`

- [ ] **Step 1: Add ADMIN_URL to Bindings**

In `apps/api/src/types.ts`, add to the `Bindings` type:

```typescript
ADMIN_URL?: string;
```

- [ ] **Step 2: Add ADMIN_URL to wrangler.toml**

In `apps/api/wrangler.toml`, add under `[vars]`:

```toml
ADMIN_URL = "http://localhost:3001"
```

- [ ] **Step 3: Update CORS to include admin origin**

In `apps/api/src/index.ts`, change the CORS `origin` from a static array to a dynamic function:

Replace:
```typescript
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
```

With:
```typescript
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = [
        c.env.WEB_URL || "http://localhost:3000",
        c.env.ADMIN_URL || "http://localhost:3001",
      ];
      return allowed.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
```

Note: The Hono CORS middleware `origin` can be a function `(origin: string, c: Context) => string`. Return the origin if allowed, empty string otherwise.

- [ ] **Step 4: Update Better Auth trustedOrigins**

In `apps/api/src/lib/auth.ts`, change:

```typescript
trustedOrigins: [env.WEB_URL || "http://localhost:3000"],
```

To:
```typescript
trustedOrigins: [
  env.WEB_URL || "http://localhost:3000",
  env.ADMIN_URL || "http://localhost:3001",
],
```

- [ ] **Step 5: Verify API still starts**

Run: `pnpm --filter @starter/api dev`
Expected: Wrangler starts without errors. Kill after confirming.

- [ ] **Step 6: Commit**

```bash
git add apps/api/
git commit -m "feat(api): add ADMIN_URL to CORS and Better Auth trustedOrigins"
```

---

## Task 4: API — Admin middleware (role check)

**Files:**
- Create: `apps/api/src/routes/admin/middleware.ts`

- [ ] **Step 1: Create admin middleware**

Create `apps/api/src/routes/admin/middleware.ts`:

```typescript
import { createMiddleware } from "hono/factory";
import { createAuth } from "../../lib/auth";
import { createDb, users } from "@starter/db";
import { eq } from "drizzle-orm";
import type { Env } from "../../types";
import type { UserRole } from "@starter/shared";

type AdminVariables = {
  adminUser: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  };
};

export type AdminEnv = Env & { Variables: AdminVariables };

export const adminMiddleware = createMiddleware<AdminEnv>(async (c, next) => {
  const auth = createAuth(c.env);

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Not authenticated" }, 401);
  }

  const db = createDb(c.env.DATABASE_URL);
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user || (user.role !== "admin" && user.role !== "super_admin")) {
    return c.json({ error: "Forbidden" }, 403);
  }

  c.set("adminUser", {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  });

  await next();
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/admin/
git commit -m "feat(api): add admin role-checking middleware"
```

---

## Task 5: API — GET /api/admin/me endpoint

**Files:**
- Create: `apps/api/src/routes/admin/me.ts`

- [ ] **Step 1: Create the me route**

Create `apps/api/src/routes/admin/me.ts`:

```typescript
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { adminMeResponseSchema } from "@starter/shared";
import type { AdminEnv } from "./middleware";

const route = createRoute({
  method: "get",
  path: "/api/admin/me",
  responses: {
    200: {
      content: { "application/json": { schema: adminMeResponseSchema } },
      description: "Current admin user info",
    },
    401: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Not authenticated",
    },
    403: {
      content: { "application/json": { schema: z.object({ error: z.string() }) } },
      description: "Not authorized",
    },
  },
});

export const adminMeRoute = new OpenAPIHono<AdminEnv>().openapi(route, async (c) => {
  const adminUser = c.get("adminUser");
  return c.json(
    {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
    },
    200
  );
});
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/admin/me.ts
git commit -m "feat(api): add GET /api/admin/me endpoint"
```

---

## Task 6: API — Admin users CRUD endpoints

**Files:**
- Create: `apps/api/src/routes/admin/users.ts`

- [ ] **Step 1: Create users routes**

Create `apps/api/src/routes/admin/users.ts`:

```typescript
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq, ilike, or, sql, count } from "drizzle-orm";
import { createDb, users } from "@starter/db";
import {
  adminUserListQuerySchema,
  adminUserListResponseSchema,
  adminUserSchema,
  adminUserUpdateRoleSchema,
  adminUserUpdateStatusSchema,
} from "@starter/shared";
import type { AdminEnv } from "./middleware";

const errorSchema = z.object({ error: z.string() });

// GET /api/admin/users
const listRoute = createRoute({
  method: "get",
  path: "/api/admin/users",
  request: {
    query: adminUserListQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: adminUserListResponseSchema } },
      description: "User list",
    },
  },
});

// GET /api/admin/users/:id
const getRoute = createRoute({
  method: "get",
  path: "/api/admin/users/{id}",
  request: {
    params: z.object({ id: z.string().uuid() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: adminUserSchema } },
      description: "User detail",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "User not found",
    },
  },
});

// PATCH /api/admin/users/:id/role
const updateRoleRoute = createRoute({
  method: "patch",
  path: "/api/admin/users/{id}/role",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: adminUserUpdateRoleSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: adminUserSchema } },
      description: "Role updated",
    },
    403: {
      content: { "application/json": { schema: errorSchema } },
      description: "Not authorized",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "User not found",
    },
  },
});

// PATCH /api/admin/users/:id/status
const updateStatusRoute = createRoute({
  method: "patch",
  path: "/api/admin/users/{id}/status",
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      content: { "application/json": { schema: adminUserUpdateStatusSchema } },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: adminUserSchema } },
      description: "Status updated",
    },
    403: {
      content: { "application/json": { schema: errorSchema } },
      description: "Cannot change own status",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "User not found",
    },
  },
});

function formatUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role as "user" | "admin" | "super_admin",
    banned: user.banned ?? null,
    bannedReason: user.bannedReason ?? null,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

export const adminUsersRoute = new OpenAPIHono<AdminEnv>()
  .openapi(listRoute, async (c) => {
    const { page, limit, search } = c.req.valid("query");
    const db = createDb(c.env.DATABASE_URL);
    const offset = (page - 1) * limit;

    const where = search
      ? or(
          ilike(users.email, `%${search}%`),
          ilike(users.name, `%${search}%`)
        )
      : undefined;

    const [data, [{ total }]] = await Promise.all([
      db.select().from(users).where(where).limit(limit).offset(offset).orderBy(users.createdAt),
      db.select({ total: count() }).from(users).where(where),
    ]);

    return c.json(
      {
        data: data.map(formatUser),
        total,
        page,
        limit,
      },
      200
    );
  })
  .openapi(getRoute, async (c) => {
    const { id } = c.req.valid("param");
    const db = createDb(c.env.DATABASE_URL);

    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(formatUser(user), 200);
  })
  .openapi(updateRoleRoute, async (c) => {
    const adminUser = c.get("adminUser");
    const { id } = c.req.valid("param");
    const { role } = c.req.valid("json");

    // Only super_admin can change roles
    if (adminUser.role !== "super_admin") {
      return c.json({ error: "Only super_admin can change roles" }, 403);
    }

    // Cannot change own role
    if (adminUser.id === id) {
      return c.json({ error: "Cannot change your own role" }, 403);
    }

    const db = createDb(c.env.DATABASE_URL);
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(formatUser(user), 200);
  })
  .openapi(updateStatusRoute, async (c) => {
    const adminUser = c.get("adminUser");
    const { id } = c.req.valid("param");
    const { banned, bannedReason } = c.req.valid("json");

    // Cannot ban yourself
    if (adminUser.id === id) {
      return c.json({ error: "Cannot change your own status" }, 403);
    }

    const db = createDb(c.env.DATABASE_URL);
    const [user] = await db
      .update(users)
      .set({ banned, bannedReason: bannedReason ?? null, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(formatUser(user), 200);
  });
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/routes/admin/users.ts
git commit -m "feat(api): add admin user CRUD endpoints with role hierarchy"
```

---

## Task 7: API — Mount admin routes

**Files:**
- Create: `apps/api/src/routes/admin/index.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create admin route aggregator**

Create `apps/api/src/routes/admin/index.ts`:

```typescript
import { OpenAPIHono } from "@hono/zod-openapi";
import { adminMiddleware, type AdminEnv } from "./middleware";
import { adminMeRoute } from "./me";
import { adminUsersRoute } from "./users";

export const adminRoute = new OpenAPIHono<AdminEnv>();

adminRoute.use("*", adminMiddleware);
adminRoute.route("/", adminMeRoute);
adminRoute.route("/", adminUsersRoute);
```

- [ ] **Step 2: Mount in main app**

In `apps/api/src/index.ts`, add the import:

```typescript
import { adminRoute } from "./routes/admin";
```

And add the route after the existing routes (before `app.doc`):

```typescript
app.route("/", adminRoute);
```

- [ ] **Step 3: Verify API compiles**

Run: `pnpm --filter @starter/api dev`
Expected: Starts without errors. Kill after confirming.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/admin/ apps/api/src/index.ts
git commit -m "feat(api): mount admin routes with middleware"
```

---

## Task 8: Seed Script — Bootstrap super_admin

**Files:**
- Create: `packages/db/src/seed-admin.ts`

- [ ] **Step 1: Create seed script**

Create `packages/db/src/seed-admin.ts`:

```typescript
import { eq } from "drizzle-orm";
import { createDb } from "./client";
import { users } from "./schema";

async function main() {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    console.error("ADMIN_EMAIL environment variable is required");
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required");
    process.exit(1);
  }

  const db = createDb(databaseUrl);

  const [user] = await db
    .update(users)
    .set({ role: "super_admin" })
    .where(eq(users.email, email))
    .returning({ id: users.id, email: users.email, role: users.role });

  if (!user) {
    console.error(`User with email "${email}" not found`);
    process.exit(1);
  }

  console.log(`Updated user ${user.email} (${user.id}) to super_admin`);
  process.exit(0);
}

main();
```

- [ ] **Step 2: Add script to package.json**

In `packages/db/package.json`, add to `"scripts"`:

```json
"db:seed-admin": "tsx src/seed-admin.ts"
```

Also add `tsx` to `devDependencies` if not already present:

```json
"tsx": "^4.0"
```

- [ ] **Step 3: Commit**

```bash
git add packages/db/
git commit -m "feat(db): add seed-admin script for bootstrapping super_admin"
```

---

## Task 9: Admin Frontend — Project scaffold

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/next.config.ts`
- Create: `apps/admin/postcss.config.mjs`
- Create: `apps/admin/src/app/globals.css`
- Create: `apps/admin/.env.example`

- [ ] **Step 1: Create package.json**

Create `apps/admin/package.json`:

```json
{
  "name": "@starter/admin",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "test": "vitest run",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.0",
    "@starter/shared": "workspace:*",
    "@starter/ui": "workspace:*",
    "@tanstack/react-query": "^5.67",
    "better-auth": "^1.5.5",
    "lucide-react": "^0.475",
    "next": "^15.3",
    "react": "^19.0",
    "react-dom": "^19.0",
    "react-hook-form": "^7.54",
    "zod": "^3.24"
  },
  "devDependencies": {
    "@starter/typescript-config": "workspace:*",
    "@tailwindcss/postcss": "^4.0",
    "@types/node": "25.5.0",
    "@types/react": "^19.0",
    "@types/react-dom": "^19.0",
    "tailwindcss": "^4.0",
    "typescript": "^5.7",
    "vitest": "^3.1"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `apps/admin/tsconfig.json`:

```json
{
  "extends": "@starter/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "tsBuildInfoFile": ".next/.tsbuildinfo"
  },
  "include": [
    "next-env.d.ts",
    "src/**/*.ts",
    "src/**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

Create `apps/admin/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@starter/ui", "@starter/shared"],
};

export default nextConfig;
```

- [ ] **Step 4: Create postcss.config.mjs**

Create `apps/admin/postcss.config.mjs`:

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 5: Create globals.css**

Create `apps/admin/src/app/globals.css`:

```css
@import "tailwindcss";
```

- [ ] **Step 6: Create .env.example**

Create `apps/admin/.env.example`:

```
NEXT_PUBLIC_API_URL=http://localhost:8787
```

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`
Expected: Installs without errors. `apps/admin` is picked up by pnpm-workspace.yaml (`apps/*`).

- [ ] **Step 8: Commit**

```bash
git add apps/admin/
git commit -m "feat(admin): scaffold Next.js admin app"
```

---

## Task 10: Admin Frontend — Root layout, providers, auth client

**Files:**
- Create: `apps/admin/src/app/layout.tsx`
- Create: `apps/admin/src/app/providers.tsx`
- Create: `apps/admin/src/app/page.tsx`
- Create: `apps/admin/src/lib/auth-client.ts`

- [ ] **Step 1: Create auth client**

Create `apps/admin/src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787",
});
```

- [ ] **Step 2: Create providers**

Create `apps/admin/src/app/providers.tsx`:

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

- [ ] **Step 3: Create root layout**

Create `apps/admin/src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Starter admin dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create root page (redirect to login)**

Create `apps/admin/src/app/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/login");
}
```

- [ ] **Step 5: Verify dev server starts**

Run: `pnpm --filter @starter/admin dev`
Expected: Next.js starts on port 3001 without errors.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/
git commit -m "feat(admin): add root layout, providers, auth client"
```

---

## Task 11: Admin Frontend — API client with TanStack Query hooks

**Files:**
- Create: `apps/admin/src/lib/api.ts`

- [ ] **Step 1: Create API client**

Create `apps/admin/src/lib/api.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AdminMeResponse,
  AdminUserListResponse,
  AdminUser,
  AdminUserUpdateRole,
  AdminUserUpdateStatus,
} from "@starter/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// GET /api/admin/me
export function useAdminMe() {
  return useQuery<AdminMeResponse>({
    queryKey: ["admin", "me"],
    queryFn: () => apiFetch("/api/admin/me"),
    retry: false,
  });
}

// GET /api/admin/users
export function useAdminUsers(params: { page: number; limit: number; search?: string }) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) searchParams.set("search", params.search);

  return useQuery<AdminUserListResponse>({
    queryKey: ["admin", "users", params],
    queryFn: () => apiFetch(`/api/admin/users?${searchParams}`),
  });
}

// GET /api/admin/users/:id
export function useAdminUser(id: string) {
  return useQuery<AdminUser>({
    queryKey: ["admin", "users", id],
    queryFn: () => apiFetch(`/api/admin/users/${id}`),
    enabled: !!id,
  });
}

// PATCH /api/admin/users/:id/role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminUserUpdateRole & { id: string }) =>
      apiFetch<AdminUser>(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// PATCH /api/admin/users/:id/status
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminUserUpdateStatus & { id: string }) =>
      apiFetch<AdminUser>(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/lib/api.ts
git commit -m "feat(admin): add API client with TanStack Query hooks"
```

---

## Task 12: Admin Frontend — Login page

**Files:**
- Create: `apps/admin/src/app/login/page.tsx`

- [ ] **Step 1: Create login page**

Create `apps/admin/src/app/login/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@starter/shared";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { useAdminMe } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setApiError(null);

    // Step 1: Sign in with Better Auth
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setApiError(error.message ?? "ログインに失敗しました");
      return;
    }

    // Step 2: Check admin role
    setCheckingRole(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const res = await fetch(`${API_URL}/api/admin/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        await authClient.signOut();
        setApiError("管理者権限がありません");
        return;
      }

      router.push("/dashboard");
    } catch {
      await authClient.signOut();
      setApiError("権限の確認に失敗しました");
    } finally {
      setCheckingRole(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>管理者ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <p role="alert" className="text-sm text-red-600">
                {apiError}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                aria-describedby={errors.email ? "email-error" : undefined}
                {...register("email")}
              />
              {errors.email && (
                <p id="email-error" role="alert" className="text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              {errors.password && (
                <p id="password-error" role="alert" className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || checkingRole}>
              {checkingRole ? "権限確認中..." : isSubmitting ? "ログイン中..." : "ログイン"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/login/
git commit -m "feat(admin): add login page with role verification"
```

---

## Task 13: Admin Frontend — Dashboard layout with sidebar and auth guard

**Files:**
- Create: `apps/admin/src/components/sidebar.tsx`
- Create: `apps/admin/src/app/(dashboard)/layout.tsx`
- Create: `apps/admin/src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Create sidebar component**

Create `apps/admin/src/components/sidebar.tsx`:

```typescript
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { cn } from "@starter/ui";

const navItems = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/users", label: "ユーザー管理", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-gray-50 p-4">
      <div className="mb-8">
        <h1 className="text-lg font-bold">Admin</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Button variant="outline" className="w-full" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        ログアウト
      </Button>
    </aside>
  );
}
```

- [ ] **Step 2: Create dashboard layout with auth guard**

Create `apps/admin/src/app/(dashboard)/layout.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminMe } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { authClient } from "@/lib/auth-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, isLoading, error } = useAdminMe();

  useEffect(() => {
    if (!isLoading && (error || !data)) {
      authClient.signOut().then(() => router.push("/login"));
    }
  }, [isLoading, error, data, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create dashboard home page**

Create `apps/admin/src/app/(dashboard)/dashboard/page.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@starter/ui";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ダッシュボード</h1>
      <Card>
        <CardHeader>
          <CardTitle>概要</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">管理者ダッシュボードへようこそ。左のメニューからユーザー管理にアクセスできます。</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 4: Verify dev server with dashboard**

Run: `pnpm --filter @starter/admin dev`
Expected: Starts on port 3001. Navigate to `http://localhost:3001` → redirects to `/login`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/components/ apps/admin/src/app/\(dashboard\)/
git commit -m "feat(admin): add sidebar, dashboard layout with auth guard"
```

---

## Task 14: Admin Frontend — Users list page

**Files:**
- Create: `apps/admin/src/app/(dashboard)/users/page.tsx`

- [ ] **Step 1: Create users list page**

Create `apps/admin/src/app/(dashboard)/users/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminUsers } from "@/lib/api";
import { Input, Badge, Button } from "@starter/ui";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  const { data, isLoading } = useAdminUsers({ page, limit, search: search || undefined });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">ユーザー管理</h1>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="メールアドレスまたは名前で検索..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit">検索</Button>
      </form>

      {isLoading ? (
        <p className="text-gray-500">読み込み中...</p>
      ) : !data || data.data.length === 0 ? (
        <p className="text-gray-500">ユーザーが見つかりません。</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium">メール</th>
                  <th className="px-4 py-3 font-medium">名前</th>
                  <th className="px-4 py-3 font-medium">権限</th>
                  <th className="px-4 py-3 font-medium">状態</th>
                  <th className="px-4 py-3 font-medium">登録日</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link href={`/users/${user.id}`} className="text-blue-600 hover:underline">
                        {user.email}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{user.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={user.role === "super_admin" ? "destructive" : user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {user.banned ? (
                        <Badge variant="destructive">停止</Badge>
                      ) : (
                        <Badge variant="secondary">有効</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(user.createdAt).toLocaleDateString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              全 {data.total} 件中 {(page - 1) * limit + 1}–{Math.min(page * limit, data.total)} 件
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/users/page.tsx
git commit -m "feat(admin): add users list page with search and pagination"
```

---

## Task 15: Admin Frontend — User detail page

**Files:**
- Create: `apps/admin/src/app/(dashboard)/users/[id]/page.tsx`

- [ ] **Step 1: Create user detail page**

Create `apps/admin/src/app/(dashboard)/users/[id]/page.tsx`:

```typescript
"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAdminUser, useAdminMe, useUpdateUserRole, useUpdateUserStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@starter/ui";
import { ArrowLeft } from "lucide-react";
import type { UserRole } from "@starter/shared";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: me } = useAdminMe();
  const { data: user, isLoading } = useAdminUser(id);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) {
    return <p className="text-gray-500">読み込み中...</p>;
  }

  if (!user) {
    return <p className="text-gray-500">ユーザーが見つかりません。</p>;
  }

  const isSelf = me?.id === user.id;
  const isSuperAdmin = me?.role === "super_admin";

  const handleRoleChange = (role: UserRole) => {
    updateRole.mutate({ id: user.id, role });
  };

  const handleToggleBan = () => {
    updateStatus.mutate({
      id: user.id,
      banned: !user.banned,
      bannedReason: user.banned ? undefined : "管理者により停止",
    });
  };

  return (
    <div>
      <button
        onClick={() => router.push("/users")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        ユーザー一覧に戻る
      </button>

      <h1 className="mb-6 text-2xl font-bold">ユーザー詳細</h1>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">メール</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">名前</span>
              <span>{user.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">メール確認</span>
              <Badge variant={user.emailVerified ? "default" : "secondary"}>
                {user.emailVerified ? "確認済み" : "未確認"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">登録日</span>
              <span>{new Date(user.createdAt).toLocaleString("ja-JP")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card>
          <CardHeader>
            <CardTitle>権限</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">現在の権限</p>
                <Badge
                  variant={
                    user.role === "super_admin"
                      ? "destructive"
                      : user.role === "admin"
                        ? "default"
                        : "secondary"
                  }
                  className="mt-1"
                >
                  {user.role}
                </Badge>
              </div>
              {isSuperAdmin && !isSelf && (
                <div className="flex gap-2">
                  {(["user", "admin", "super_admin"] as const).map((role) => (
                    <Button
                      key={role}
                      variant={user.role === role ? "default" : "outline"}
                      size="sm"
                      disabled={user.role === role || updateRole.isPending}
                      onClick={() => handleRoleChange(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              )}
              {!isSuperAdmin && (
                <p className="text-sm text-gray-400">権限変更は super_admin のみ</p>
              )}
            </div>
            {updateRole.error && (
              <p className="mt-2 text-sm text-red-600">{updateRole.error.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Status Management */}
        <Card>
          <CardHeader>
            <CardTitle>アカウント状態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">状態</p>
                <Badge variant={user.banned ? "destructive" : "secondary"} className="mt-1">
                  {user.banned ? "停止中" : "有効"}
                </Badge>
                {user.bannedReason && (
                  <p className="mt-1 text-sm text-gray-500">理由: {user.bannedReason}</p>
                )}
              </div>
              {!isSelf && (
                <Button
                  variant={user.banned ? "default" : "destructive"}
                  size="sm"
                  disabled={updateStatus.isPending}
                  onClick={handleToggleBan}
                >
                  {user.banned ? "有効化" : "停止"}
                </Button>
              )}
            </div>
            {updateStatus.error && (
              <p className="mt-2 text-sm text-red-600">{updateStatus.error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(dashboard\)/users/\[id\]/
git commit -m "feat(admin): add user detail page with role and status management"
```

---

## Task 16: Final Verification

- [ ] **Step 1: Verify full build**

Run: `pnpm build`
Expected: All apps and packages build without errors.

- [ ] **Step 2: Verify dev servers start together**

Run: `pnpm dev` (starts all apps via turborepo)
Expected: API on 8787, Web on 3000, Admin on 3001 — all start without errors.

- [ ] **Step 3: Manual smoke test**

1. Create a user via `apps/web` (register + verify email)
2. Run `ADMIN_EMAIL=<email> DATABASE_URL=<url> pnpm --filter @starter/db db:seed-admin` to promote to super_admin
3. Go to `http://localhost:3001` → redirects to `/login`
4. Login with the super_admin credentials → redirected to `/dashboard`
5. Navigate to `/users` → see user list
6. Click a user → see detail page
7. Change role, toggle ban status
8. Login as non-admin → should see "管理者権限がありません" error

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: add admin dashboard with user management"
```
