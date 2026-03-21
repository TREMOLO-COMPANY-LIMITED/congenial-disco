"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, Badge } from "@starter/ui";

interface StatusCardProps {
  name: string;
  status: "pass" | "fail" | "not_configured";
  message?: string;
  durationMs?: number;
  icon: LucideIcon;
}

const statusConfig = {
  pass: { label: "Pass", variant: "success" as const },
  fail: { label: "Fail", variant: "destructive" as const },
  not_configured: { label: "Not Configured", variant: "warning" as const },
};

export function StatusCard({
  name,
  status,
  message,
  durationMs,
  icon: Icon,
}: StatusCardProps) {
  const config = statusConfig[status];

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{name}</p>
          {message && (
            <p className="text-xs text-muted-foreground truncate">{message}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {durationMs !== undefined && (
            <span className="text-xs text-muted-foreground">{durationMs}ms</span>
          )}
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
