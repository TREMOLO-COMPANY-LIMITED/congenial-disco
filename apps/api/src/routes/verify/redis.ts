import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { verifyResponseSchema } from "@starter/shared";
import type { Env } from "../../types";
import { Redis } from "@upstash/redis/cloudflare";

const route = createRoute({
  method: "get",
  path: "/verify/redis",
  responses: {
    200: {
      content: { "application/json": { schema: verifyResponseSchema } },
      description: "Redis verification",
    },
  },
});

export const verifyRedisRoute = new OpenAPIHono<Env>().openapi(
  route,
  async (c) => {
    const url = c.env.UPSTASH_REDIS_REST_URL;
    const token = c.env.UPSTASH_REDIS_REST_TOKEN;
    const start = Date.now();

    if (!url || !token) {
      return c.json(
        {
          category: "cache",
          items: [
            {
              name: "Upstash Redis",
              status: "not_configured" as const,
              message: "UPSTASH_REDIS_REST_URL or TOKEN is not configured",
            },
          ],
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    try {
      const redis = new Redis({ url, token });
      await redis.set("__verify_ping", "pong");
      const val = await redis.get("__verify_ping");
      await redis.del("__verify_ping");

      return c.json(
        {
          category: "cache",
          items: [
            {
              name: "Upstash Redis",
              status: val === "pong" ? ("pass" as const) : ("fail" as const),
              message:
                val === "pong" ? "SET/GET/DEL succeeded" : `Unexpected value: ${val}`,
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
          category: "cache",
          items: [
            {
              name: "Upstash Redis",
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
  }
);
