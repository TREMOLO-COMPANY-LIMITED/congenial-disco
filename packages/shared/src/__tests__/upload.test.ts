import { describe, it, expect } from "vitest";
import {
  presignedUrlRequestSchema,
  presignedUrlResponseSchema,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
} from "../types/upload";

describe("presignedUrlRequestSchema", () => {
  it("accepts valid image/jpeg with valid size", () => {
    const result = presignedUrlRequestSchema.safeParse({
      contentType: "image/jpeg",
      fileSize: 1024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid content type", () => {
    const result = presignedUrlRequestSchema.safeParse({
      contentType: "application/pdf",
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
  });

  it("rejects file size over 5MB", () => {
    const result = presignedUrlRequestSchema.safeParse({
      contentType: "image/png",
      fileSize: 5_242_881,
    });
    expect(result.success).toBe(false);
  });

  it("accepts all allowed image types", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      const result = presignedUrlRequestSchema.safeParse({
        contentType: type,
        fileSize: 1000,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("presignedUrlResponseSchema", () => {
  it("accepts valid response", () => {
    const result = presignedUrlResponseSchema.safeParse({
      presignedUrl: "https://example.com/upload",
      publicUrl: "https://cdn.example.com/avatars/123.jpg",
    });
    expect(result.success).toBe(true);
  });
});

describe("constants", () => {
  it("MAX_FILE_SIZE is 5MB", () => {
    expect(MAX_FILE_SIZE).toBe(5_242_880);
  });
});
