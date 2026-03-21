import { describe, it, expect } from "vitest";
import {
  healthResponseSchema,
  verifyItemSchema,
  verifyResponseSchema,
} from "../types";
import { z } from "zod";

describe("healthResponseSchema", () => {
  it("parses valid data", () => {
    const result = healthResponseSchema.parse({
      status: "ok",
      timestamp: "2025-01-01T00:00:00.000Z",
    });
    expect(result.status).toBe("ok");
  });

  it("rejects missing fields", () => {
    expect(() => healthResponseSchema.parse({})).toThrow(z.ZodError);
  });
});

describe("verifyItemSchema", () => {
  it("parses pass status", () => {
    const result = verifyItemSchema.parse({
      name: "Test",
      status: "pass",
      message: "OK",
      durationMs: 42,
    });
    expect(result.status).toBe("pass");
  });

  it("parses not_configured status", () => {
    const result = verifyItemSchema.parse({
      name: "Test",
      status: "not_configured",
    });
    expect(result.status).toBe("not_configured");
  });

  it("rejects invalid status", () => {
    expect(() =>
      verifyItemSchema.parse({ name: "Test", status: "unknown" })
    ).toThrow(z.ZodError);
  });
});

describe("verifyResponseSchema", () => {
  it("parses full response", () => {
    const result = verifyResponseSchema.parse({
      category: "database",
      items: [
        { name: "DB", status: "pass", message: "Connected", durationMs: 10 },
      ],
      timestamp: "2025-01-01T00:00:00.000Z",
    });
    expect(result.category).toBe("database");
    expect(result.items).toHaveLength(1);
  });
});
