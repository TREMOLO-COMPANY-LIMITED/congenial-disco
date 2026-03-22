import { createMiddleware } from "hono/factory";
import { createAuth } from "../../lib/auth";
import { createDb, users, eq } from "@starter/db";
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
