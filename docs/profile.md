# Profile Image Upload

## Overview

Authenticated users can upload a profile avatar image. The image is stored in Cloudflare R2 via presigned URLs, and the public URL is saved to the user's `image` column in the database through Better Auth's `updateUser` API.

## Upload Flow

```
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│  Browser  │       │   API    │       │    R2    │       │    DB    │
└────┬─────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                   │                   │                   │
     │  1. Select file   │                   │                   │
     │  (client-side     │                   │                   │
     │   validation)     │                   │                   │
     │                   │                   │                   │
     │  2. POST /api/upload/presigned-url    │                   │
     │  {contentType, fileSize}              │                   │
     │──────────────────>│                   │                   │
     │                   │                   │                   │
     │                   │  Validate session │                   │
     │                   │  Validate input   │                   │
     │                   │  Generate key:    │                   │
     │                   │  avatars/{userId}.{ext}               │
     │                   │                   │                   │
     │  3. Response      │                   │                   │
     │  {presignedUrl,   │                   │                   │
     │   publicUrl}      │                   │                   │
     │<──────────────────│                   │                   │
     │                   │                   │                   │
     │  4. PUT file directly to R2           │                   │
     │  (Content-Type header)                │                   │
     │──────────────────────────────────────>│                   │
     │                                       │                   │
     │  5. 200 OK                            │                   │
     │<──────────────────────────────────────│                   │
     │                   │                   │                   │
     │  6. POST /api/auth/update-user        │                   │
     │  {image: publicUrl}                   │                   │
     │──────────────────>│                   │                   │
     │                   │  Better Auth      │                   │
     │                   │  updateUser       │                   │
     │                   │──────────────────────────────────────>│
     │                   │                   │                   │
     │  7. 200 OK        │                   │                   │
     │<──────────────────│                   │                   │
     │                   │                   │                   │
     │  8. Update UI     │                   │                   │
     │  with new avatar  │                   │                   │
```

## Error Handling Flow

```
┌──────────────────────────────────┐
│      User selects image file     │
└────────────────┬─────────────────┘
                 │
                 v
┌──────────────────────────────────┐
│   Client-side validation         │
│   - File type in allowlist?      │  ──No──> Show error message
│   - File size <= 5MB?            │
└────────────────┬─────────────────┘
                 │ Yes
                 v
┌──────────────────────────────────┐
│   Show image preview             │
│   Show loading overlay           │
└────────────────┬─────────────────┘
                 │
                 v
┌──────────────────────────────────┐
│   Request presigned URL          │
│   POST /api/upload/presigned-url │  ──Fail──> Show error message
└────────────────┬─────────────────┘
                 │ Success
                 v
┌──────────────────────────────────┐
│   Upload file to R2              │
│   PUT presignedUrl               │  ──Fail──> Show error message
└────────────────┬─────────────────┘
                 │ Success
                 v
┌──────────────────────────────────┐
│   Update user profile            │
│   authClient.updateUser()        │  ──Fail──> Show error + retry button
└────────────────┬─────────────────┘            (publicUrl is retained)
                 │ Success
                 v
┌──────────────────────────────────┐
│   Upload complete                │
│   UI updated with new avatar     │
└──────────────────────────────────┘
```

When `updateUser` fails after a successful R2 upload, the component retains the `publicUrl` and displays a retry button. This avoids re-uploading the file and only retries the database update.

## API Endpoint

### `POST /api/upload/presigned-url`

Generates a presigned URL for uploading an avatar image to R2.

**Authentication:** Required (Better Auth session cookie)

**Request:**

```json
{
  "contentType": "image/jpeg",
  "fileSize": 102400
}
```

| Field | Type | Description |
| --- | --- | --- |
| `contentType` | string | MIME type. One of: `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| `fileSize` | number | File size in bytes. Must be &lt;= 5,242,880 (5 MB) |

**Success Response (200):**

```json
{
  "presignedUrl": "https://<bucket>.r2.cloudflarestorage.com/avatars/<userId>.jpg?...",
  "publicUrl": "https://<r2-public-domain>/avatars/<userId>.jpg"
}
```

| Field | Type | Description |
| --- | --- | --- |
| `presignedUrl` | string | Signed URL for PUT upload (expires in 5 minutes) |
| `publicUrl` | string | Permanent public URL for the uploaded image |

**Error Responses:**

| Status | Body | Cause |
| --- | --- | --- |
| 400 | `{"error": "..."}` | Invalid content type or file size exceeds 5 MB |
| 401 | `{"error": "Not authenticated"}` | Missing or invalid session |
| 500 | `{"error": "..."}` | R2 not configured or presigned URL generation failed |

## R2 Object Key Strategy

Each user gets a single avatar key: `avatars/{userId}.{ext}`

- Uploading a new image with the same format overwrites the previous one automatically.
- Uploading a different format (e.g., switching from JPEG to PNG) creates a new key. The old key remains but is no longer referenced in the database.

## Validation Rules

| Rule | Client-side | Server-side |
| --- | --- | --- |
| File type | `accept` attribute + JS check | Zod enum validation on `contentType` |
| File size | JS check (5 MB) | Zod `.max()` on `fileSize` |
| Content-Type match | N/A | `Content-Type` signed in presigned URL |
| Authentication | N/A | Better Auth session verification |

## Security

- **Authentication:** All upload requests require a valid session cookie (`credentials: "include"`).
- **Signed Content-Type:** The presigned URL includes `Content-Type` as a signed header. R2 rejects uploads where the actual `Content-Type` does not match the declared type.
- **User-scoped keys:** The R2 object key includes the authenticated user's ID (`avatars/{userId}.{ext}`), preventing users from overwriting another user's avatar.
- **Presigned URL expiry:** URLs expire after 5 minutes.
- **Client-side validation** is for UX only and is not a security boundary.

## File Structure

```
packages/shared/src/types/upload.ts        # Zod schemas, constants (ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE)
apps/api/src/lib/r2.ts                     # R2 S3Client factory
apps/api/src/routes/upload/presigned-url.ts # Presigned URL endpoint
apps/api/src/routes/upload/index.ts         # Route barrel
apps/web/src/components/avatar-upload.tsx    # Upload component (3-step flow + retry)
apps/web/src/app/profile/page.tsx           # Profile page
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret key |
| `R2_BUCKET_NAME` | Yes | R2 bucket name (e.g., `starter`) |
| `R2_PUBLIC_URL` | Yes | Public URL prefix (e.g., `https://pub-xxx.r2.dev`) |

## R2 Bucket Configuration

The R2 bucket requires CORS rules to allow direct browser uploads:

| Setting | Value |
| --- | --- |
| Allowed Origins | `http://localhost:3000` (dev), production domain |
| Allowed Methods | `PUT`, `GET`, `HEAD` |
| Allowed Headers | `*` |
| Max Age | `3600` |

Configure via Cloudflare Dashboard: **R2 &gt; \[bucket\] &gt; Settings &gt; CORS Policy**.