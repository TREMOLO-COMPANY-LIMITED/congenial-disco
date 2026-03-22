"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { AvatarUpload } from "@/components/avatar-upload";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  // Sync session image to local state on load
  useEffect(() => {
    if (session?.user.image) {
      setImageUrl(session.user.image);
    }
  }, [session?.user.image]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>プロフィール</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <AvatarUpload
            currentImageUrl={imageUrl}
            onUploadComplete={(newImageUrl) => {
              setImageUrl(newImageUrl);
            }}
          />
          <div className="text-center">
            <p className="font-medium">{session.user.name || "名前未設定"}</p>
            <p className="text-sm text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
