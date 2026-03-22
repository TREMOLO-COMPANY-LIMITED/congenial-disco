import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq, ilike, or, count } from "drizzle-orm";
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
