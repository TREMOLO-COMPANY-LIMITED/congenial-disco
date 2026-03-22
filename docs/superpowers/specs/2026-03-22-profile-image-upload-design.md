# Profile Image Upload Design

## Overview

Add profile image upload functionality using Cloudflare R2 with Presigned URLs. Users can upload an avatar image which is stored in R2 and referenced via the existing `image` column on the user table.

## Approach

**Presigned URL + Better Auth `updateUser`** (Approach A)

1. Frontend requests a Presigned URL from the API
2. Frontend uploads the file directly to R2 using the Presigned URL
3. Frontend calls Better Auth's `updateUser` to save the public URL to the user's `image` column

## API

### `POST /api/upload/presigned-url` (authenticated)

**Request:**
```json
{ "contentType": "image/jpeg", "fileSize": 123456 }
```

**Validation:**
- User must be authenticated (Better Auth session)
- `contentType` must be one of: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- `fileSize` must be <= 5MB (5,242,880 bytes)

**Processing:**
- Use fixed key per user: `avatars/{userId}.{ext}` (overwrites previous avatar automatically)
- Create Presigned URL using `@aws-sdk/client-s3` `PutObjectCommand` (5 min expiry)
- Include `Content-Type` as a signed header so R2 rejects mismatched uploads
- Include `Content-Length` constraint to enforce file size server-side
- Build public URL from R2 public bucket URL + key

**Response (200):**
```json
{
  "presignedUrl": "https://...",
  "publicUrl": "https://..."
}
```

**Error Responses:**
- `400` — Invalid content type or file size exceeds limit
- `401` — Not authenticated
- `500` — Failed to generate presigned URL

## Frontend Flow

1. User selects an image file (max 5MB; JPEG, PNG, WebP, GIF)
2. Client-side validation: file size and type
3. Call `POST /api/upload/presigned-url` with `credentials: 'include'` (cookie forwarding required)
4. `PUT` the file directly to the returned Presigned URL with matching `Content-Type` header
5. Call `authClient.updateUser({ image: publicUrl })` to persist the URL
6. If `updateUser` fails after successful R2 upload, show error and allow retry of step 5 using the same `publicUrl`
7. Update UI to show the new avatar

**Loading states:** Show upload progress indicator during steps 3-5. Show image preview immediately after file selection (before upload completes).

## File Structure

```
apps/api/src/routes/upload/
  presigned-url.ts          # Presigned URL endpoint

apps/api/src/types.ts       # Update Bindings type to include R2_PUBLIC_URL

apps/web/src/app/profile/
  page.tsx                  # Profile page with avatar upload

apps/web/src/components/
  avatar-upload.tsx          # Avatar upload component
```

## Security

- Authentication required (Better Auth session verification)
- Content type validation (server-side allowlist)
- `Content-Type` included as signed header in Presigned URL (R2 rejects mismatched uploads)
- `Content-Length` constraint in Presigned URL (server-side size enforcement)
- File key scoped to userId with fixed name (prevents cross-user writes, auto-cleans old images)
- Presigned URL expires in 5 minutes
- Client-side file size and type validation (UX, not security boundary)

## Environment Variables

Existing R2 variables are reused:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

New:
- `R2_PUBLIC_URL` — Public URL prefix for the R2 bucket (e.g., `https://storage.example.com`)
