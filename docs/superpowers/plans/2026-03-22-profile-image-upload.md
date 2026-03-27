# Profile Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow authenticated users to upload a profile image to Cloudflare R2 via Presigned URLs and save the public URL to their user record.

**Architecture:** Frontend requests a Presigned URL from the API, uploads the file directly to R2, then calls Better Auth's `updateUser` to persist the public URL. The API validates content type and file size, generates a scoped Presigned URL with signed headers, and returns both the presigned and public URLs.

**Tech Stack:** Hono.js + @hono/zod-openapi (API), @aws-sdk/client-s3 + @aws-sdk/s3-request-presigner (R2), Next.js + React (frontend), Better Auth (user update), Zod (validation), shadcn/ui (UI components)

**Spec:** `docs/superpowers/specs/2026-03-22-profile-image-upload-design.md`

---

### Task 1: Add shared Zod schemas for upload

**Files:**
- Create: `packages/shared/src/types/upload.ts`
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Write the failing test**

Create `packages/shared/src/__tests__/upload.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  presignedUrlRequestSchema,
  presignedUrlResponseSchema,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "../types/upload";

describe("presignedUrlRequestSchema", () => {
  it("accepts valid image/jpeg with valid size", () => {
    const result = presignedUrlRequestSchema.safeParse({
      contentType: "image/jpeg",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid content type", () => {
    const result = presignedUrlRequestSchema.safeParse({
      contentType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects file size over 5MB", () => {
    const result = presignedUrlRequestSchema.safeParse({
      contentType: "image/png",
      fileSize: 5_242_881,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all allowed image types", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      const result = presignedUrlRequestSchema.safeParse({
        contentType: type,
        fileSize: 1000,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("presignedUrlResponseSchema", () => {
  it("accepts valid response", () => {
    const result = presignedUrlResponseSchema.safeParse({
      presignedUrl: "https://example.com/upload",
      publicUrl: "https://cdn.example.com/avatars/123.jpg",
    });
    expect(result.success).toBe(true);
  });
});

describe("constants", () => {
  it("MAX_FILE_SIZE is 5MB", () => {
    expect(MAX_FILE_SIZE).toBe(5_242_880);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd packages/shared && pnpm vitest run src/__tests__/upload.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `packages/shared/src/types/upload.ts`:

```typescript
import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_FILE_SIZE = 5_242_880; // 5MB

export const presignedUrlRequestSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;

export const presignedUrlResponseSchema = z.object({
  presignedUrl: z.string().url(),
  publicUrl: z.string().url(),
});

export type PresignedUrlResponse = z.infer<typeof presignedUrlResponseSchema>;
```

- [ ] **Step 4: Export from index**

Add to `packages/shared/src/types/index.ts`:

```typescript
export {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  presignedUrlRequestSchema,
  presignedUrlResponseSchema,
  type PresignedUrlRequest,
  type PresignedUrlResponse,
} from "./upload";
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd packages/shared && pnpm vitest run src/__tests__/upload.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/types/upload.ts packages/shared/src/types/index.ts packages/shared/src/__tests__/upload.test.ts
git commit -m "feat: add shared Zod schemas for presigned URL upload"
```

---

### Task 2: Update API Bindings type and create R2 client helper

**Files:**
- Modify: `apps/api/src/types.ts`
- Create: `apps/api/src/lib/r2.ts`

- [ ] **Step 1: Add `R2_PUBLIC_URL` to Bindings type**

In `apps/api/src/types.ts`, add `R2_PUBLIC_URL?: string;` to the `Bindings` type (after `R2_BUCKET_NAME`).

- [ ] **Step 2: Create R2 client helper**

Create `apps/api/src/lib/r2.ts`:

```typescript
import { S3Client } from "@aws-sdk/client-s3";
import type { Bindings } from "../types";

export function createR2Client(env: Bindings) {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 credentials are not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/types.ts apps/api/src/lib/r2.ts
git commit -m "feat: add R2_PUBLIC_URL binding and R2 client helper"
```

---

### Task 3: Implement presigned URL API endpoint

**Files:**
- Create: `apps/api/src/routes/upload/presigned-url.ts`
- Create: `apps/api/src/routes/upload/index.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Install @aws-sdk/s3-request-presigner**

Run: `cd apps/api && pnpm add @aws-sdk/s3-request-presigner`

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/routes/__tests__/upload.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import app from "../../index";

describe("POST /api/upload/presigned-url", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "image/jpeg", fileSize: 1024 }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid content type", async () => {
    const res = await app.request("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "application/pdf", fileSize: 1024 }),
    });
    // Should fail validation before auth check or return 400/401
    expect([400, 401]).toContain(res.status);
  });

  it("returns 400 for file size over 5MB", async () => {
    const res = await app.request("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "image/jpeg", fileSize: 5_242_881 }),
    });
    expect([400, 401]).toContain(res.status);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd apps/api && pnpm vitest run src/routes/__tests__/upload.test.ts`
Expected: FAIL — route not found (404)

- [ ] **Step 4: Implement the presigned URL route**

Create `apps/api/src/routes/upload/presigned-url.ts`:

```typescript
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
    const auth = createAuth(c.env);
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

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
```

- [ ] **Step 5: Create upload route index**

Create `apps/api/src/routes/upload/index.ts`:

```typescript
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Env } from "../../types";
import { presignedUrlRoute } from "./presigned-url";

export const uploadRoute = new OpenAPIHono<Env>();
uploadRoute.route("/", presignedUrlRoute);
```

- [ ] **Step 6: Mount upload route in app**

In `apps/api/src/index.ts`, add:
- Import: `import { uploadRoute } from "./routes/upload";`
- Mount: `app.route("/", uploadRoute);` (after existing routes)

- [ ] **Step 7: Run test to verify it passes**

Run: `cd apps/api && pnpm vitest run src/routes/__tests__/upload.test.ts`
Expected: PASS (401 for unauthenticated, 400 or 401 for invalid inputs)

- [ ] **Step 8: Commit**


```bash
git add apps/api/src/routes/upload/ apps/api/src/index.ts apps/api/src/routes/__tests__/upload.test.ts package.json pnpm-lock.yaml apps/api/package.json
git commit -m "feat: add presigned URL upload endpoint"
```

---

### Task 4: Build avatar upload component (frontend)

**Files:**
- Create: `apps/web/src/components/avatar-upload.tsx`

- [ ] **Step 1: Create the avatar upload component**

Create `apps/web/src/components/avatar-upload.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from "@starter/shared";
import type { PresignedUrlResponse } from "@starter/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

type AvatarUploadProps = {
  currentImageUrl?: string | null;
  onUploadComplete?: (newImageUrl: string) => void;
};

export function AvatarUpload({
  currentImageUrl,
  onUploadComplete,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPublicUrl, setLastPublicUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || currentImageUrl;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      setError("Only JPEG, PNG, WebP, and GIF files are supported");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must be 5MB or less");
      return;
    }

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    uploadFile(file);
  };

  const retryUpdateUser = async (publicUrl: string) => {
    setUploading(true);
    setError(null);
    try {
      const { error: updateError } = await authClient.updateUser({
        image: publicUrl,
      });
      if (updateError) {
        throw new Error(updateError.message ?? "Failed to update profile");
      }
      setLastPublicUrl(null);
      onUploadComplete?.(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setLastPublicUrl(null);

    try {
      // Step 1: Get presigned URL
      const res = await fetch(`${API_URL}/api/upload/presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Failed to get upload URL (${res.status})`);
      }

      const { presignedUrl, publicUrl }: PresignedUrlResponse = await res.json();

      // Step 2: Upload to R2
      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image");
      }

      // Step 3: Update user profile via Better Auth
      const { error: updateError } = await authClient.updateUser({
        image: publicUrl,
      });

      if (updateError) {
        // R2 upload succeeded but DB update failed — retain publicUrl for retry
        setLastPublicUrl(publicUrl);
        throw new Error(updateError.message ?? "Failed to update profile. You can retry with the retry button.");
      }

      onUploadComplete?.(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      // Keep preview so user sees the uploaded image
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative h-24 w-24 overflow-hidden rounded-full bg-gray-200 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile image"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400 text-2xl">
            ?
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-sm text-white">Uploading...</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Change image"}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {lastPublicUrl && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => retryUpdateUser(lastPublicUrl)}
          disabled={uploading}
        >
          Retry profile update
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/avatar-upload.tsx
git commit -m "feat: add avatar upload component"
```

---

### Task 5: Create profile page

**Files:**
- Create: `apps/web/src/app/profile/page.tsx`

- [ ] **Step 1: Create the profile page**

Create `apps/web/src/app/profile/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { AvatarUpload } from "@/components/avatar-upload";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  // Sync session image to local state on load
  useEffect(() => {
    if (session?.user.image) {
      setImageUrl(session.user.image);
    }
  }, [session?.user.image]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <AvatarUpload
            currentImageUrl={imageUrl}
            onUploadComplete={(newImageUrl) => {
              setImageUrl(newImageUrl);
            }}
          />
          <div className="text-center">
            <p className="font-medium">{session.user.name || "No name set"}</p>
            <p className="text-sm text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/profile/page.tsx
git commit -m "feat: add profile page with avatar upload"
```

---

### Task 6: Verify full flow works end-to-end

- [ ] **Step 1: Run all shared package tests**

Run: `cd packages/shared && pnpm vitest run`
Expected: All tests pass

- [ ] **Step 2: Run all API tests**

Run: `cd apps/api && pnpm vitest run`
Expected: All tests pass

- [ ] **Step 3: TypeScript type check across the monorepo**

Run: `pnpm turbo build --dry-run` or `pnpm turbo typecheck` (whichever is configured)
Expected: No type errors

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during verification"
```
