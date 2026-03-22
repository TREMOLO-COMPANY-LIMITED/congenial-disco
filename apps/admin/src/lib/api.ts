import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  AdminMeResponse,
  AdminUserListResponse,
  AdminUser,
  AdminUserUpdateRole,
  AdminUserUpdateStatus,
} from "@starter/shared";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// GET /api/admin/me
export function useAdminMe() {
  return useQuery<AdminMeResponse>({
    queryKey: ["admin", "me"],
    queryFn: () => apiFetch("/api/admin/me"),
    retry: false,
  });
}

// GET /api/admin/users
export function useAdminUsers(params: { page: number; limit: number; search?: string }) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.search) searchParams.set("search", params.search);

  return useQuery<AdminUserListResponse>({
    queryKey: ["admin", "users", params],
    queryFn: () => apiFetch(`/api/admin/users?${searchParams}`),
  });
}

// GET /api/admin/users/:id
export function useAdminUser(id: string) {
  return useQuery<AdminUser>({
    queryKey: ["admin", "users", id],
    queryFn: () => apiFetch(`/api/admin/users/${id}`),
    enabled: !!id,
  });
}

// PATCH /api/admin/users/:id/role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminUserUpdateRole & { id: string }) =>
      apiFetch<AdminUser>(`/api/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// PATCH /api/admin/users/:id/status
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: AdminUserUpdateStatus & { id: string }) =>
      apiFetch<AdminUser>(`/api/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
