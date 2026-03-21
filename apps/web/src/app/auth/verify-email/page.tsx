"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@starter/ui";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

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

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
