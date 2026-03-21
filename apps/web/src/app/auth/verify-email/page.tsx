"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@starter/ui";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(!!token);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      const { error } = await authClient.emailVerification.verifyEmail({
        query: { token },
      });
      if (error) {
        setError(error.message);
        setVerifying(false);
        return;
      }
      router.push("/auth/login?verified=true");
    };

    verify();
  }, [token, router]);

  if (verifying) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>メールアドレスを確認中...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>認証エラー</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <p className="mt-4 text-center text-sm text-gray-600">
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline"
            >
              登録画面に戻る
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>メールを確認してください</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">
          {email && (
            <>
              <span className="font-medium">{email}</span> に確認メールを送信しました。
            </>
          )}
          メール内のリンクをクリックして、アカウントを有効化してください。
        </p>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link
            href="/auth/login"
            className="text-blue-600 hover:underline"
          >
            ログイン画面へ
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
