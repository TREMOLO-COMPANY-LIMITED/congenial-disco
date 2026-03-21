# Registration Feature Design

## Overview

Email + password registration with mandatory email verification, using Better Auth's built-in capabilities. No custom API endpoints needed — frontend connects directly to Better Auth via the client SDK.

## Requirements

- Registration fields: name, email, password, password confirmation
- Password: 8+ characters, must include uppercase, lowercase, and number
- Email verification required before login is allowed
- Post-registration flow: register → "check your email" screen → click link → login page
- Profile image upload handled separately (post-registration, out of scope for this spec)
- No social login — email/password only

## Architecture

```
[Register Form] → authClient.signUp.email() → [Better Auth /api/auth/sign-up/email]
                                                       ↓
                                               Create user in DB
                                                       ↓
                                               Send verification email via Resend
                                                       ↓
[Verify Email Page] ← redirect              [User clicks link in email]
                                                       ↓
                                               Better Auth verifies token
                                                       ↓
                                               emailVerified = true
                                                       ↓
                                               [Redirect to Login Page]
```

## Backend Changes

### `apps/api/src/lib/auth.ts`

Single file change — extend existing Better Auth config:

- Enable `emailVerification`:
  - `sendOnSignUp: true` — auto-send on registration
  - `sendVerificationEmail` callback uses Resend to send the email
  - Callback URL: `{WEB_URL}/auth/verify-email`
- Set `requireEmailVerification: true` in `emailAndPassword` config

No custom API routes needed. Better Auth handles all auth endpoints.

## Frontend Changes

### New Pages

| Path | Purpose |
|------|---------|
| `/auth/register` | Registration form |
| `/auth/verify-email` | "Check your email" screen + token verification handler |
| `/auth/login` | Login form |

### Layout

- `apps/web/src/app/auth/layout.tsx` — shared auth layout (centered card)

### Registration Page (`/auth/register`)

- React Hook Form + Zod validation
- Fields: name, email, password, password confirmation
- Password validation: 8+ chars, uppercase, lowercase, number
- Submit: `authClient.signUp.email({ name, email, password })`
- Success: redirect to `/auth/verify-email?email={email}`
- Error: display inline error message

### Verify Email Page (`/auth/verify-email`)

Two states:
1. **No token** (arrived via redirect after registration): display "Check your email" message with the email address from query params
2. **Token present** (arrived via email link): Better Auth verifies the token, on success redirect to `/auth/login`

### Login Page (`/auth/login`)

- Fields: email, password
- Submit: `authClient.signIn.email({ email, password })`
- Success: redirect to `/`
- Error: display inline error message
- Link: "Don't have an account? Register here" → `/auth/register`

## Shared Package Changes

### `packages/shared/src/types/auth.ts`

New Zod schemas:

```typescript
// Password: 8+ chars, uppercase, lowercase, number
const passwordSchema = z
  .string()
  .min(8)
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[a-z]/, "Must contain lowercase letter")
  .regex(/[0-9]/, "Must contain number");

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: passwordSchema,
  passwordConfirmation: z.string(),
}).refine(data => data.password === data.passwordConfirmation, {
  message: "Passwords do not match",
  path: ["passwordConfirmation"],
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

## UI Components

No new UI components needed. Existing Button, Input, Label, and Card components are sufficient.

## Out of Scope

- Social login (Google, GitHub, etc.)
- Profile image upload (separate post-registration flow)
- Password reset/forgot password
- Account deletion
- Rate limiting (can be added later)
