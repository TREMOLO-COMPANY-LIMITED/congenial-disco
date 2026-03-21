import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { healthResponseSchema } from "@starter/shared";

const route = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: { "application/json": { schema: healthResponseSchema } },
      description: "Health check",
    },
  },
});

export const healthRoute = new OpenAPIHono().openapi(route, (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() }, 200);
});
