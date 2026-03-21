import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { verifyResponseSchema } from "@starter/shared";
import type { Env } from "../../types";
import { Resend } from "resend";

const route = createRoute({
  method: "get",
  path: "/verify/resend",
  responses: {
    200: {
      content: { "application/json": { schema: verifyResponseSchema } },
      description: "Resend email verification",
    },
  },
});

export const verifyResendRoute = new OpenAPIHono<Env>().openapi(
  route,
  async (c) => {
    const apiKey = c.env.RESEND_API_KEY;
    const start = Date.now();

    if (!apiKey) {
      return c.json(
        {
          category: "email",
          items: [
            {
              name: "Resend",
              status: "not_configured" as const,
              message: "RESEND_API_KEY is not configured",
            },
          ],
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    try {
      const resend = new Resend(apiKey);
      await resend.domains.list();

      return c.json(
        {
          category: "email",
          items: [
            {
              name: "Resend",
              status: "pass" as const,
              message: "API key valid, domains listed",
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
          category: "email",
          items: [
            {
              name: "Resend",
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
