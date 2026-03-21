import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Resend } from "resend";
import { createDb, users, sessions, accounts, verifications } from "@starter/db";
import type { Bindings } from "../types";

export function createAuth(env: Bindings) {
  const db = createDb(env.DATABASE_URL);
  const resend = new Resend(env.RESEND_API_KEY);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: { user: users, session: sessions, account: accounts, verification: verifications },
    }),
    baseURL: env.BETTER_AUTH_URL || "http://localhost:8787",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: [env.WEB_URL || "http://localhost:3000"],
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: user.email,
          subject: "メールアドレスの確認",
          html: `<a href="${url}">メールアドレスを確認する</a>`,
        });
      },
    },
  });
}
