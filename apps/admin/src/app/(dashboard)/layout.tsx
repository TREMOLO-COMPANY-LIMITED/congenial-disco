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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
