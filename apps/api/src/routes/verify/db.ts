import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { verifyResponseSchema } from "@starter/shared";
import type { Env } from "../../types";
import { createDb, sql } from "@starter/db";

const route = createRoute({
  method: "get",
  path: "/verify/db",
  responses: {
    200: {
      content: { "application/json": { schema: verifyResponseSchema } },
      description: "Database verification",
    },
  },
});

export const verifyDbRoute = new OpenAPIHono<Env>().openapi(route, async (c) => {
  const dbUrl = c.env.DATABASE_URL;
  const start = Date.now();

  if (!dbUrl || dbUrl.includes("user:password@") || dbUrl.includes("<supabase-pooler-host>")) {
    return c.json(
      {
        category: "database",
        items: [
          {
            name: "Drizzle + PostgreSQL",
            status: "not_configured" as const,
            message: "DATABASE_URL is not configured",
          },
        ],
        timestamp: new Date().toISOString(),
      },
      200
    );
  }

  try {
    const db = createDb(dbUrl);
    await db.execute(sql`SELECT 1`);
    return c.json(
      {
        category: "database",
        items: [
          {
            name: "Drizzle + PostgreSQL",
            status: "pass" as const,
            message: "Connected and executed query",
            durationMs: Date.now() - start,
          },
        ],
        timestamp: new Date().toISOString(),
      },
      200
    );
  } catch (e) {
    return c.json(
      {
        category: "database",
        items: [
          {
            name: "Drizzle + PostgreSQL",
            status: "fail" as const,
            message: e instanceof Error ? e.message : "Unknown error",
            durationMs: Date.now() - start,
          },
        ],
        timestamp: new Date().toISOString(),
      },
      200
    );
  }
});
