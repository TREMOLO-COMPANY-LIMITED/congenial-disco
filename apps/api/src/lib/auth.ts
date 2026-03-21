import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { createDb } from "@starter/db";
import type { Bindings } from "../types";

export function createAuth(env: Bindings) {
  const db = createDb(env.DATABASE_URL);
  const resend = new Resend(env.RESEND_API_KEY);

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
        const verificationUrl = `${env.WEB_URL || "http://localhost:3000"}/auth/verify-email?token=${encodeURIComponent(token)}`;
        await resend.emails.send({
          from: "noreply@example.com",
          to: user.email,
          subject: "メールアドレスの確認",
          html: `<a href="${verificationUrl}">メールアドレスを確認する</a>`,
        });
      },
    },
  });
}
