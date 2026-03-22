"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useAdminUser, useAdminMe, useUpdateUserRole, useUpdateUserStatus } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "@starter/ui";
import { ArrowLeft, Mail, Calendar, Hash, User, Shield, Ban } from "lucide-react";
import type { UserRole } from "@starter/shared";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: me } = useAdminMe();
  const { data: user, isLoading } = useAdminUser(id);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">ユーザーが見つかりません。</p>
      </div>
    );
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => router.push("/users")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          ユーザー一覧に戻る
        </Button>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-semibold">
            {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {user.name || user.email}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge
                variant={
                  user.role === "super_admin"
                    ? "destructive"
                    : user.role === "admin"
                      ? "default"
                      : "secondary"
                }
              >
                {user.role}
              </Badge>
              {user.banned ? (
                <Badge variant="destructive">停止中</Badge>
              ) : (
                <Badge variant="outline">有効</Badge>
              )}
              {user.emailVerified ? (
                <Badge variant="outline">メール確認済み</Badge>
              ) : (
                <Badge variant="secondary">メール未確認</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">基本情報</CardTitle>
            <CardDescription>ユーザーのプロフィール情報</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="truncate font-mono text-sm">{user.id}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">メールアドレス</p>
                <p className="text-sm">{user.email}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">名前</p>
                <p className="text-sm">{user.name ?? "未設定"}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">登録日</p>
                <p className="text-sm">{new Date(user.createdAt).toLocaleString("ja-JP")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Role Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">権限管理</CardTitle>
                  <CardDescription>ユーザーのロールを変更します</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">現在の権限</span>
                  <Badge
                    variant={
                      user.role === "super_admin"
                        ? "destructive"
                        : user.role === "admin"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {user.role}
                  </Badge>
                </div>
                {isSuperAdmin && !isSelf ? (
                  <div className="flex gap-2">
                    {(["user", "admin", "super_admin"] as const).map((role) => (
                      <Button
                        key={role}
                        variant={user.role === role ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        disabled={user.role === role || updateRole.isPending}
                        onClick={() => handleRoleChange(role)}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {isSelf ? "自分の権限は変更できません" : "権限変更は super_admin のみ可能です"}
                  </p>
                )}
                {updateRole.error && (
                  <p className="text-sm text-destructive">{updateRole.error.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">アカウント状態</CardTitle>
                  <CardDescription>アカウントの停止・有効化を管理します</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-muted-foreground">状態</span>
                    {user.bannedReason && (
                      <p className="text-xs text-muted-foreground">理由: {user.bannedReason}</p>
                    )}
                  </div>
                  <Badge variant={user.banned ? "destructive" : "outline"}>
                    {user.banned ? "停止中" : "有効"}
                  </Badge>
                </div>
                {!isSelf ? (
                  <Button
                    variant={user.banned ? "default" : "destructive"}
                    size="sm"
                    className="w-full"
                    disabled={updateStatus.isPending}
                    onClick={handleToggleBan}
                  >
                    {user.banned ? "アカウントを有効化" : "アカウントを停止"}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    自分のアカウント状態は変更できません
                  </p>
                )}
                {updateStatus.error && (
                  <p className="text-sm text-destructive">{updateStatus.error.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
