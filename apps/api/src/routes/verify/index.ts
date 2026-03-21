import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { verifyResponseSchema } from "@starter/shared";
import type { Env } from "../../types";
import { verifyDbRoute } from "./db";
import { verifyRedisRoute } from "./redis";
import { verifyR2Route } from "./r2";
import { verifyResendRoute } from "./resend";
import { verifySentryRoute } from "./sentry";

const allRoute = createRoute({
  method: "get",
  path: "/verify/all",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            results: z.array(verifyResponseSchema),
            timestamp: z.string(),
          }),
        },
      },
      description: "All verification results",
    },
  },
});

export const verifyRoute = new OpenAPIHono<Env>();

// Mount individual routes
verifyRoute.route("/", verifyDbRoute);
verifyRoute.route("/", verifyRedisRoute);
verifyRoute.route("/", verifyR2Route);
verifyRoute.route("/", verifyResendRoute);
verifyRoute.route("/", verifySentryRoute);

// Aggregated endpoint
verifyRoute.openapi(allRoute, async (c) => {
  const baseUrl = new URL(c.req.url).origin;
  const endpoints = [
    "/verify/db",
    "/verify/redis",
    "/verify/r2",
    "/verify/resend",
    "/verify/sentry",
  ];

  const results = await Promise.allSettled(
    endpoints.map(async (path) => {
      const res = await c.env?.ENVIRONMENT
        ? fetch(`${baseUrl}${path}`, { headers: c.req.raw.headers })
        : fetch(`${baseUrl}${path}`);
      const awaited = await res;
      return awaited.json();
    })
  );

  const verifyResults = results.map((r, i) => {
    if (r.status === "fulfilled") {
      return r.value;
    }
    return {
      category: endpoints[i].replace("/verify/", ""),
      items: [
        {
          name: endpoints[i],
          status: "fail",
          message: r.reason?.message || "Request failed",
        },
      ],
      timestamp: new Date().toISOString(),
    };
  });

  return c.json(
    {
      results: verifyResults,
      timestamp: new Date().toISOString(),
    },
    200
  );
});
