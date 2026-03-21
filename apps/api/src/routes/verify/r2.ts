import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { verifyResponseSchema } from "@starter/shared";
import type { Env } from "../../types";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";

const route = createRoute({
  method: "get",
  path: "/verify/r2",
  responses: {
    200: {
      content: { "application/json": { schema: verifyResponseSchema } },
      description: "R2 Storage verification",
    },
  },
});

export const verifyR2Route = new OpenAPIHono<Env>().openapi(
  route,
  async (c) => {
    const accountId = c.env.R2_ACCOUNT_ID;
    const accessKeyId = c.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = c.env.R2_SECRET_ACCESS_KEY;
    const bucketName = c.env.R2_BUCKET_NAME;
    const start = Date.now();

    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      return c.json(
        {
          category: "storage",
          items: [
            {
              name: "Cloudflare R2",
              status: "not_configured" as const,
              message: "R2 credentials are not configured",
            },
          ],
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    try {
      const client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });

      await client.send(new HeadBucketCommand({ Bucket: bucketName }));

      return c.json(
        {
          category: "storage",
          items: [
            {
              name: "Cloudflare R2",
              status: "pass" as const,
              message: `Bucket "${bucketName}" accessible`,
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
          category: "storage",
          items: [
            {
              name: "Cloudflare R2",
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
