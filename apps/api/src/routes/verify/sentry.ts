import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { verifyResponseSchema } from "@starter/shared";
import type { Env } from "../../types";
import * as Sentry from "@sentry/cloudflare";

const route = createRoute({
  method: "get",
  path: "/verify/sentry",
  responses: {
    200: {
      content: { "application/json": { schema: verifyResponseSchema } },
      description: "Sentry monitoring verification",
    },
  },
});

export const verifySentryRoute = new OpenAPIHono<Env>().openapi(
  route,
  async (c) => {
    const dsn = c.env.SENTRY_DSN;
    const start = Date.now();

    if (!dsn) {
      return c.json(
        {
          category: "monitoring",
          items: [
            {
              name: "Sentry",
              status: "not_configured" as const,
              message: "SENTRY_DSN is not configured",
            },
          ],
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    try {
      Sentry.captureMessage("verification-ping", "info");
      await Sentry.flush(2000);

      return c.json(
        {
          category: "monitoring",
          items: [
            {
              name: "Sentry",
              status: "pass" as const,
              message: "Test message captured",
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
          category: "monitoring",
          items: [
            {
              name: "Sentry",
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
