"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, LayoutDashboard, LogOut, Shield } from "lucide-react";
import { Button, Separator } from "@starter/ui";
import { authClient } from "@/lib/auth-client";
import { cn } from "@starter/ui";
import { useAdminMe } from "@/lib/api";

const mainNav = [
  { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/users", label: "ユーザー管理", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useAdminMe();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Header */}
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Shield className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground">Admin Dashboard</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          メニュー
        </div>
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        {me && (
          <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {me.name?.charAt(0)?.toUpperCase() || me.email.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {me.name || me.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{me.role}</p>
            </div>
          </div>
        )}
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          ログアウト
        </Button>
      </div>
    </aside>
  );
}
