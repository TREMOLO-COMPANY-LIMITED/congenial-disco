import { z } from "zod";

// Role
export const userRoleSchema = z.enum(["user", "admin", "super_admin"]);
export type UserRole = z.infer<typeof userRoleSchema>;

// Admin API - Request schemas
export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;

export const adminUserUpdateRoleSchema = z.object({
  role: userRoleSchema,
});
export type AdminUserUpdateRole = z.infer<typeof adminUserUpdateRoleSchema>;

export const adminUserUpdateStatusSchema = z.object({
  banned: z.boolean(),
  bannedReason: z.string().optional(),
});
export type AdminUserUpdateStatus = z.infer<typeof adminUserUpdateStatusSchema>;

// Admin API - Response schemas
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: userRoleSchema,
  banned: z.boolean().nullable(),
  bannedReason: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.string().datetime(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUserListResponseSchema = z.object({
  data: z.array(adminUserSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});
export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

export const adminMeResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: userRoleSchema,
});
export type AdminMeResponse = z.infer<typeof adminMeResponseSchema>;
