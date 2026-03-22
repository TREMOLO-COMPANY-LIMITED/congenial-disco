import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const MAX_FILE_SIZE = 5_242_880; // 5MB

export const presignedUrlRequestSchema = z.object({
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});

export type PresignedUrlRequest = z.infer<typeof presignedUrlRequestSchema>;

export const presignedUrlResponseSchema = z.object({
  presignedUrl: z.string().url(),
  publicUrl: z.string().url(),
});

export type PresignedUrlResponse = z.infer<typeof presignedUrlResponseSchema>;
