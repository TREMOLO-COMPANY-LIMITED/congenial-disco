import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  presignedUrlRequestSchema,
  presignedUrlResponseSchema,
} from "@starter/shared";
import type { Env } from "../../types";
import { createAuth } from "../../lib/auth";
import { createR2Client } from "../../lib/r2";

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const route = createRoute({
  method: "post",
  path: "/api/upload/presigned-url",
  request: {
    body: {
      content: {
        "application/json": { schema: presignedUrlRequestSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: presignedUrlResponseSchema } },
      description: "Presigned URL generated",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Invalid request",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Not authenticated",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Internal error",
    },
  },
});

export const presignedUrlRoute = new OpenAPIHono<Env>().openapi(
  route,
  async (c) => {
    // Authenticate
    let session: Awaited<ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>> | null = null;
    try {
      const auth = createAuth(c.env);
      session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
    } catch {
      return c.json({ error: "Not authenticated" }, 401);
    }

    if (!session) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const { contentType, fileSize } = c.req.valid("json");
    const ext = CONTENT_TYPE_TO_EXT[contentType];

    if (!ext) {
      return c.json({ error: "Unsupported content type" }, 400);
    }

    const bucketName = c.env.R2_BUCKET_NAME;
    const publicUrl = c.env.R2_PUBLIC_URL;

    if (!bucketName || !publicUrl) {
      return c.json({ error: "Storage not configured" }, 500);
    }

    const key = `avatars/${session.user.id}.${ext}`;

    try {
      const client = createR2Client(c.env);
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
      });

      const presignedUrl = await getSignedUrl(client, command, {
        expiresIn: 300,
        signableHeaders: new Set(["content-type"]),
      });

      return c.json(
        {
          presignedUrl,
          publicUrl: `${publicUrl}/${key}`,
        },
        200
      );
    } catch (e) {
      return c.json(
        { error: e instanceof Error ? e.message : "Failed to generate URL" },
        500
      );
    }
  }
);
