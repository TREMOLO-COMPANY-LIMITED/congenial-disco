"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAdminUser, useAdminMe, useUpdateUserRole, useUpdateUserStatus } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@starter/ui";
import { ArrowLeft } from "lucide-react";
import type { UserRole } from "@starter/shared";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: me } = useAdminMe();
  const { data: user, isLoading } = useAdminUser(id);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) {
    return <p className="text-gray-500">読み込み中...</p>;
  }

  if (!user) {
    return <p className="text-gray-500">ユーザーが見つかりません。</p>;
  }

  const isSelf = me?.id === user.id;
  const isSuperAdmin = me?.role === "super_admin";

  const handleRoleChange = (role: UserRole) => {
    updateRole.mutate({ id: user.id, role });
  };

  const handleToggleBan = () => {
    updateStatus.mutate({
      id: user.id,
      banned: !user.banned,
      bannedReason: user.banned ? undefined : "管理者により停止",
    });
  };

  return (
    <div>
      <button
        onClick={() => router.push("/users")}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        ユーザー一覧に戻る
      </button>

      <h1 className="mb-6 text-2xl font-bold">ユーザー詳細</h1>

      <div className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">ID</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">メール</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">名前</span>
              <span>{user.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">メール確認</span>
              <Badge variant={user.emailVerified ? "default" : "secondary"}>
                {user.emailVerified ? "確認済み" : "未確認"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">登録日</span>
              <span>{new Date(user.createdAt).toLocaleString("ja-JP")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card>
          <CardHeader>
            <CardTitle>権限</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">現在の権限</p>
                <Badge
                  variant={
                    user.role === "super_admin"
                      ? "destructive"
                      : user.role === "admin"
                        ? "default"
                        : "secondary"
                  }
                  className="mt-1"
                >
                  {user.role}
                </Badge>
              </div>
              {isSuperAdmin && !isSelf && (
                <div className="flex gap-2">
                  {(["user", "admin", "super_admin"] as const).map((role) => (
                    <Button
                      key={role}
                      variant={user.role === role ? "default" : "outline"}
                      size="sm"
                      disabled={user.role === role || updateRole.isPending}
                      onClick={() => handleRoleChange(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              )}
              {!isSuperAdmin && (
                <p className="text-sm text-gray-400">権限変更は super_admin のみ</p>
              )}
            </div>
            {updateRole.error && (
              <p className="mt-2 text-sm text-red-600">{updateRole.error.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Status Management */}
        <Card>
          <CardHeader>
            <CardTitle>アカウント状態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">状態</p>
                <Badge variant={user.banned ? "destructive" : "secondary"} className="mt-1">
                  {user.banned ? "停止中" : "有効"}
                </Badge>
                {user.bannedReason && (
                  <p className="mt-1 text-sm text-gray-500">理由: {user.bannedReason}</p>
                )}
              </div>
              {!isSelf && (
                <Button
                  variant={user.banned ? "default" : "destructive"}
                  size="sm"
                  disabled={updateStatus.isPending}
                  onClick={handleToggleBan}
                >
                  {user.banned ? "有効化" : "停止"}
                </Button>
              )}
            </div>
            {updateStatus.error && (
              <p className="mt-2 text-sm text-red-600">{updateStatus.error.message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
