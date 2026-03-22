"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@starter/ui";
import { Users, UserCheck, ShieldCheck, ShieldOff } from "lucide-react";
import { useAdminUsers } from "@/lib/api";

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data } = useAdminUsers({ page: 1, limit: 1 });
  const totalUsers = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground">管理者ダッシュボードの概要です。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="ユーザー総数"
          value={totalUsers}
          description="登録済みユーザー"
          icon={Users}
        />
        <StatCard
          title="認証済み"
          value="—"
          description="メール確認済みユーザー"
          icon={UserCheck}
        />
        <StatCard
          title="管理者"
          value="—"
          description="admin + super_admin"
          icon={ShieldCheck}
        />
        <StatCard
          title="停止中"
          value="—"
          description="アカウント停止ユーザー"
          icon={ShieldOff}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ようこそ</CardTitle>
          <CardDescription>管理者ダッシュボードへようこそ。</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            左のメニューから「ユーザー管理」にアクセスして、ユーザーの一覧表示、権限変更、アカウント停止/有効化を行えます。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
