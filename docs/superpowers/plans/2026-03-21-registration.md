# Registration Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build email + password registration with mandatory email verification using Better Auth.

**Architecture:** Frontend pages (register, verify-email, login) connect to Better Auth via client SDK. Backend config extends Better Auth with email verification via Resend. Shared Zod schemas validate forms.

**Tech Stack:** Better Auth, React Hook Form, Zod, Resend, Next.js App Router, Hono/Cloudflare Workers

**Spec:** `docs/superpowers/specs/2026-03-21-registration-design.md`

---

### Task 1: Shared Validation Schemas

**Files:**
- Create: `packages/shared/src/types/auth.ts`
- Modify: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/__tests__/auth.test.ts`

- [ ] **Step 1: Write tests for auth schemas**

Create `packages/shared/src/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../types/auth";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "Password1",
      passwordConfirmation: "Password1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "password1",
      passwordConfirmation: "password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "PASSWORD1",
      passwordConfirmation: "PASSWORD1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "Passwordx",
      passwordConfirmation: "Passwordx",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 chars", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "Pass1",
      passwordConfirmation: "Pass1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "Password1",
      passwordConfirmation: "Password2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("passwordConfirmation");
    }
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "not-an-email",
      password: "Password1",
      passwordConfirmation: "Password1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "test@example.com",
      password: "Password1",
      passwordConfirmation: "Password1",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "bad",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/shared && pnpm vitest run src/__tests__/auth.test.ts`
Expected: FAIL — module `../types/auth` not found

- [ ] **Step 3: Implement auth schemas**

Create `packages/shared/src/types/auth.ts`:

```typescript
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const registerSchema = z
  .object({
    name: z.string().min(1, "Please enter your name").max(100),
    email: z.string().email("Please enter a valid email address"),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match",
    path: ["passwordConfirmation"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

- [ ] **Step 4: Re-export from types index**

Add to end of `packages/shared/src/types/index.ts`:

```typescript
export {
  passwordSchema,
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "./auth";
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/shared && pnpm vitest run src/__tests__/auth.test.ts`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/shared/src/types/auth.ts packages/shared/src/types/index.ts packages/shared/src/__tests__/auth.test.ts
git commit -m "feat: add registration and login validation schemas"
```

---

### Task 2: Backend — Better Auth Config + Environment

**Files:**
- Modify: `apps/api/src/types.ts`
- Modify: `apps/api/wrangler.toml`
- Modify: `apps/api/src/lib/auth.ts`

- [ ] **Step 1: Add `WEB_URL` to Bindings type**

In `apps/api/src/types.ts`, add `WEB_URL?: string;` to the `Bindings` type after the `SENTRY_DSN` line.

- [ ] **Step 2: Add `WEB_URL` to wrangler.toml**

In `apps/api/wrangler.toml`, add to the `[vars]` section:

```toml
WEB_URL = "http://localhost:3000"
```

- [ ] **Step 3: Update auth.ts with email verification config**

Replace the entire content of `apps/api/src/lib/auth.ts` with:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { createDb } from "@starter/db";
import type { Bindings } from "../types";

export function createAuth(env: Bindings) {
  const db = createDb(env.DATABASE_URL);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: env.BETTER_AUTH_URL || "http://localhost:8787",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_URL || "http://localhost:3000"],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, token }) => {
        const resend = new Resend(env.RESEND_API_KEY);
        const verificationUrl = `${env.WEB_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`;
        await resend.emails.send({
          from: "noreply@example.com",
          to: user.email,
          subject: "Verify your email address",
          html: `<a href="${verificationUrl}">Verify your email address</a>`,
        });
      },
    },
  });
}
```

- [ ] **Step 4: Verify the API builds**

Run: `cd apps/api && pnpm build`
Expected: Build succeeds with no type errors

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/types.ts apps/api/wrangler.toml apps/api/src/lib/auth.ts
git commit -m "feat: configure Better Auth email verification with Resend"
```

---

### Task 3: Auth Layout

**Files:**
- Create: `apps/web/src/app/auth/layout.tsx`

- [ ] **Step 1: Create auth layout**

Create `apps/web/src/app/auth/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/auth/layout.tsx
git commit -m "feat: add auth pages layout"
```

---

### Task 4: Registration Page

**Files:**
- Create: `apps/web/src/app/auth/register/page.tsx`
- Create: `apps/web/src/app/auth/register/__tests__/page.test.tsx`

- [ ] **Step 1: Write tests for registration page**

Create `apps/web/src/app/auth/register/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock auth client
const mockSignUp = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Register" })).toBeInTheDocument();
  });

  it("shows validation errors for empty form submission", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.click(screen.getByRole("button", { name: "Register" }));
    await waitFor(() => {
      expect(screen.getByText("Please enter your name")).toBeInTheDocument();
    });
  });

  it("calls signUp on valid submission and redirects", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "Password1",
      });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/auth/verify-email?email=test%40example.com"
      );
    });
  });

  it("displays API error message", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "Email already exists" },
    });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("Name"), "Test User");
    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.type(screen.getByLabelText("Confirm password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });

  it("has link to login page", () => {
    render(<RegisterPage />);
    const link = screen.getByRole("link", { name: /Login/ });
    expect(link).toHaveAttribute("href", "/auth/login");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run src/app/auth/register/__tests__/page.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement registration page**

Create `apps/web/src/app/auth/register/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@starter/shared";
import { Button } from "@starter/ui/components/button";
import { Input } from "@starter/ui/components/input";
import { Label } from "@starter/ui/components/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@starter/ui/components/card";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setApiError(null);
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    if (error) {
      setApiError(error.message);
      return;
    }
    router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <p className="text-sm text-red-600">{apiError}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirmation">Confirm password</Label>
            <Input
              id="passwordConfirmation"
              type="password"
              {...register("passwordConfirmation")}
            />
            {errors.passwordConfirmation && (
              <p className="text-sm text-red-600">
                {errors.passwordConfirmation.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm vitest run src/app/auth/register/__tests__/page.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/auth/register/
git commit -m "feat: add registration page with form validation"
```

---

### Task 5: Verify Email Page

**Files:**
- Create: `apps/web/src/app/auth/verify-email/page.tsx`
- Create: `apps/web/src/app/auth/verify-email/__tests__/page.test.tsx`

- [ ] **Step 1: Write tests for verify-email page**

Create `apps/web/src/app/auth/verify-email/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import VerifyEmailPage from "../page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

let mockSearchParams: { get: (key: string) => string | null };

const mockVerifyEmail = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailVerification: {
      verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
    },
  },
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows check-email message when email param is present and no token", () => {
    mockSearchParams = {
      get: (key: string) => (key === "email" ? "test@example.com" : null),
    };
    render(<VerifyEmailPage />);
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/Check your email/)).toBeInTheDocument();
  });

  it("calls verifyEmail when token param is present", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "abc123" : null),
    };
    mockVerifyEmail.mockResolvedValue({ error: null });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        query: { token: "abc123" },
      });
    });
  });

  it("redirects to login on successful verification", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "abc123" : null),
    };
    mockVerifyEmail.mockResolvedValue({ error: null });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login?verified=true");
    });
  });

  it("shows error on failed verification", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "bad-token" : null),
    };
    mockVerifyEmail.mockResolvedValue({
      error: { message: "Invalid token" },
    });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText("Invalid token")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run src/app/auth/verify-email/__tests__/page.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement verify-email page**

Create `apps/web/src/app/auth/verify-email/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@starter/ui/components/card";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(!!token);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      const { error } = await authClient.emailVerification.verifyEmail({
        query: { token },
      });
      if (error) {
        setError(error.message);
        setVerifying(false);
        return;
      }
      router.push("/auth/login?verified=true");
    };

    verify();
  }, [token, router]);

  if (verifying) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verifying email address...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verification Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <p className="mt-4 text-center text-sm text-gray-600">
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline"
            >
              Back to registration
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          {email && (
            <>
              <span className="font-medium">{email}</span> has been sent a verification email.
            </>
          )}
          Click the link in the email to activate your account.
        </p>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:underline"
          >
            Go to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm vitest run src/app/auth/verify-email/__tests__/page.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/auth/verify-email/
git commit -m "feat: add email verification page"
```

---

### Task 6: Login Page

**Files:**
- Create: `apps/web/src/app/auth/login/page.tsx`
- Create: `apps/web/src/app/auth/login/__tests__/page.test.tsx`

- [ ] **Step 1: Write tests for login page**

Create `apps/web/src/app/auth/login/__tests__/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../page";

const mockPush = vi.fn();
let mockSearchParams: { get: (key: string) => string | null };
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

const mockSignIn = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: (...args: unknown[]) => mockSignIn(...args),
    },
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = { get: () => null };
  });

  it("renders email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText("Email address")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
  });

  it("shows success message when verified=true", () => {
    mockSearchParams = {
      get: (key: string) => (key === "verified" ? "true" : null),
    };
    render(<LoginPage />);
    expect(
      screen.getByText(/Your email address has been verified/)
    ).toBeInTheDocument();
  });

  it("calls signIn on valid submission and redirects", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "Password1");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password1",
      });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("displays API error message", async () => {
    mockSignIn.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText("Email address"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("has link to register page", () => {
    render(<LoginPage />);
    const link = screen.getByRole("link", { name: /Register/ });
    expect(link).toHaveAttribute("href", "/auth/register");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && pnpm vitest run src/app/auth/login/__tests__/page.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement login page**

Create `apps/web/src/app/auth/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@starter/shared";
import { Button } from "@starter/ui/components/button";
import { Input } from "@starter/ui/components/input";
import { Label } from "@starter/ui/components/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@starter/ui/components/card";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified") === "true";
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setApiError(null);
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setApiError(error.message);
      return;
    }
    router.push("/");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {verified && (
            <p className="text-sm text-green-600">
              Your email address has been verified。Please log in.
            </p>
          )}

          {apiError && (
            <p className="text-sm text-red-600">{apiError}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline"
            >
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && pnpm vitest run src/app/auth/login/__tests__/page.test.tsx`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/auth/login/
git commit -m "feat: add login page"
```

---

### Task 7: Final Integration Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all shared package tests**

Run: `cd packages/shared && pnpm vitest run`
Expected: All tests PASS

- [ ] **Step 2: Run all web tests**

Run: `cd apps/web && pnpm vitest run`
Expected: All tests PASS

- [ ] **Step 3: Run full build**

Run: `pnpm turbo build`
Expected: All packages build successfully

- [ ] **Step 4: Verify dev server starts**

Run: `cd apps/web && pnpm dev` (manual check)
Navigate to `http://localhost:3000/auth/register` — registration form renders.
Navigate to `http://localhost:3000/auth/login` — login form renders.
Navigate to `http://localhost:3000/auth/verify-email?email=test@example.com` — check-email message renders.
