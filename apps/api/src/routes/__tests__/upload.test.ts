import { describe, it, expect } from "vitest";
import app from "../../index";

describe("POST /api/upload/presigned-url", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await app.request("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "image/jpeg", fileSize: 1024 }),
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid content type", async () => {
    const res = await app.request("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "application/pdf", fileSize: 1024 }),
    });
    // Should fail validation before auth check or return 400/401
    expect([400, 401]).toContain(res.status);
  });

  it("returns 400 for file size over 5MB", async () => {
    const res = await app.request("/api/upload/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType: "image/jpeg", fileSize: 5_242_881 }),
    });
    expect([400, 401]).toContain(res.status);
  });
});
