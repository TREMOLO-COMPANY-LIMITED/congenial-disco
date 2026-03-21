import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../types";
import { createAuth } from "../lib/auth";

export const authRoute = new OpenAPIHono<Env>();

authRoute.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});
