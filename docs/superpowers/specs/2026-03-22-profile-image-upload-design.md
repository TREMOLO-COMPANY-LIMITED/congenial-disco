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
{ "contentType": "image/jpeg" }
```

**Validation:**
- User must be authenticated (Better Auth session)
- `contentType` must be one of: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Processing:**
- Generate a unique key: `avatars/{userId}/{uuid}.{ext}`
- Create Presigned URL using `@aws-sdk/client-s3` `PutObjectCommand` (5 min expiry)
- Build public URL from R2 public bucket URL + key

**Response:**
```json
{
  "presignedUrl": "https://...",
  "publicUrl": "https://..."
}
```

## Frontend Flow

1. User selects an image file (max 5MB; JPEG, PNG, WebP, GIF)
2. Call `POST /api/upload/presigned-url` with the file's content type
3. `PUT` the file directly to the returned Presigned URL
4. Call `authClient.updateUser({ image: publicUrl })` to persist the URL
5. Update UI to show the new avatar

## File Structure

```
apps/api/src/routes/upload/
  presigned-url.ts          # Presigned URL endpoint

apps/web/src/app/profile/
  page.tsx                  # Profile page with avatar upload

apps/web/src/components/
  avatar-upload.tsx          # Avatar upload component
```

## Security

- Authentication required (Better Auth session verification)
- Content type validation (server-side, allowlist only)
- File key scoped to userId (prevents cross-user writes)
- Presigned URL expires in 5 minutes
- Client-side file size validation (5MB max)

## Environment Variables

Existing R2 variables are reused:
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

New:
- `R2_PUBLIC_URL` — Public URL prefix for the R2 bucket (e.g., `https://storage.example.com`)
