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
