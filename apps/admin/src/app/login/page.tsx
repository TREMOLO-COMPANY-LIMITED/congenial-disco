"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@starter/shared";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setApiError(null);

    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setApiError(error.message ?? "ログインに失敗しました");
      return;
    }

    setCheckingRole(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      const res = await fetch(`${API_URL}/api/admin/me`, {
        credentials: "include",
      });

      if (!res.ok) {
        await authClient.signOut();
        setApiError("管理者権限がありません");
        return;
      }

      router.push("/dashboard");
    } catch {
      await authClient.signOut();
      setApiError("権限の確認に失敗しました");
    } finally {
      setCheckingRole(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">管理者アカウントでログイン</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ログイン</CardTitle>
            <CardDescription>メールアドレスとパスワードを入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {apiError && (
                <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{apiError}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  autoComplete="email"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  {...register("email")}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  {...register("password")}
                />
                {errors.password && (
                  <p id="password-error" role="alert" className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || checkingRole}>
                {checkingRole ? "権限確認中..." : isSubmitting ? "ログイン中..." : "ログイン"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
