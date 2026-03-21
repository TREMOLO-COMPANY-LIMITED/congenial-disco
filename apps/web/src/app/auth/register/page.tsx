"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@starter/shared";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@starter/ui";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setApiError(null);
    const { error } = await authClient.signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
      callbackURL: `${window.location.origin}/auth/login?verified=true`,
    });
    if (error) {
      setApiError(error.message ?? "登録に失敗しました");
      return;
    }
    router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>アカウント登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {apiError && (
            <p role="alert" className="text-sm text-red-600">{apiError}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              autoComplete="name"
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <p id="email-error" role="alert" className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              aria-describedby={errors.password ? "password-error" : undefined}
              {...register("password")}
            />
            {errors.password && (
              <p id="password-error" role="alert" className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="passwordConfirmation">パスワード（確認）</Label>
            <Input
              id="passwordConfirmation"
              type="password"
              autoComplete="new-password"
              aria-describedby={errors.passwordConfirmation ? "passwordConfirmation-error" : undefined}
              {...register("passwordConfirmation")}
            />
            {errors.passwordConfirmation && (
              <p id="passwordConfirmation-error" role="alert" className="text-sm text-red-600">
                {errors.passwordConfirmation.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "登録中..." : "登録"}
          </Button>

          <p className="text-center text-sm text-gray-600">
            すでにアカウントをお持ちですか？{" "}
            <Link href="/auth/login" className="text-blue-600 hover:underline">
              ログイン
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
