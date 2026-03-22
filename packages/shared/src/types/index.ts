import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const verifyItemSchema = z.object({
  name: z.string(),
  status: z.enum(["pass", "fail", "not_configured"]),
  message: z.string().optional(),
  durationMs: z.number().optional(),
});

export type VerifyItem = z.infer<typeof verifyItemSchema>;

export const verifyResponseSchema = z.object({
  category: z.string(),
  items: z.array(verifyItemSchema),
  timestamp: z.string(),
});

export type VerifyResponse = z.infer<typeof verifyResponseSchema>;

export {
  passwordSchema,
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "./auth";

export {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  presignedUrlRequestSchema,
  presignedUrlResponseSchema,
  type PresignedUrlRequest,
  type PresignedUrlResponse,
} from "./upload";

export {
  userRoleSchema,
  adminUserListQuerySchema,
  adminUserUpdateRoleSchema,
  adminUserUpdateStatusSchema,
  adminUserSchema,
  adminUserListResponseSchema,
  adminMeResponseSchema,
  type UserRole,
  type AdminUserListQuery,
  type AdminUserUpdateRole,
  type AdminUserUpdateStatus,
  type AdminUser,
  type AdminUserListResponse,
  type AdminMeResponse,
} from "./admin";
