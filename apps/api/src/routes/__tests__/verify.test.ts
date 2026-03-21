import { describe, it, expect } from "vitest";
import { verifyResponseSchema } from "@starter/shared";
import { z } from "zod";

describe("Verify schemas", () => {
  it("verifyResponseSchema accepts valid data", () => {
    const valid = {
      category: "database",
      items: [
        {
          name: "Drizzle + Supabase PostgreSQL",
          status: "not_configured",
          message: "DATABASE_URL is not configured",
        },
      ],
      timestamp: new Date().toISOString(),
    };
    expect(() => verifyResponseSchema.parse(valid)).not.toThrow();
  });

  it("verifyResponseSchema rejects invalid status", () => {
    const invalid = {
      category: "database",
      items: [{ name: "test", status: "unknown" }],
      timestamp: new Date().toISOString(),
    };
    expect(() => verifyResponseSchema.parse(invalid)).toThrow(z.ZodError);
  });
});
