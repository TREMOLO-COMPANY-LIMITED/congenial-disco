import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createDb } from "@starter/db";
import type { Bindings } from "../types";

export function createAuth(env: Bindings) {
  const db = createDb(env.DATABASE_URL);

  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: env.BETTER_AUTH_URL || "http://localhost:8787",
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
  });
}
