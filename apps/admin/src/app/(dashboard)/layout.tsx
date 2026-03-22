"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminMe } from "@/lib/api";
import { Sidebar } from "@/components/sidebar";
import { authClient } from "@/lib/auth-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data, isLoading, error } = useAdminMe();

  useEffect(() => {
    if (!isLoading && (error || !data)) {
      authClient.signOut().then(() => router.push("/login"));
    }
  }, [isLoading, error, data, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
