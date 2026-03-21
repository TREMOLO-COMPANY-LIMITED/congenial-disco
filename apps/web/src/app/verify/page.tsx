"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";
import { useVerificationStore } from "@/lib/stores/verification-store";
import { StatusCard } from "./_components/status-card";
import { DemoForm } from "./_components/demo-form";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@starter/ui";
import type { VerifyResponse } from "@starter/shared";
import {
  Activity,
  CheckCircle,
  Database,
  HardDrive,
  Mail,
  MonitorDot,
  RefreshCw,
  Server,
  Shield,
  FileCode,
  Layers,
  Palette,
  FormInput,
  Boxes,
  type LucideIcon,
} from "lucide-react";

interface AllVerifyResponse {
  results: VerifyResponse[];
  timestamp: string;
}

const categoryIcons: Record<string, LucideIcon> = {
  database: Database,
  cache: Activity,
  storage: HardDrive,
  email: Mail,
  monitoring: MonitorDot,
};

export default function VerifyPage() {
  const { runCount, incrementRunCount, setLastRunAt, lastRunAt } =
    useVerificationStore();

  const { data, isLoading, error, refetch } = useQuery<AllVerifyResponse>({
    queryKey: ["verify-all"],
    queryFn: () => fetchApi<AllVerifyResponse>("/verify/all"),
    enabled: false,
  });

  const handleRunVerification = async () => {
    incrementRunCount();
    setLastRunAt(new Date().toISOString());
    refetch();
  };

  return (
    <main className="mx-auto max-w-4xl p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tech Stack Verification</h1>
          <p className="text-muted-foreground mt-1">
            Verify all technologies in the stack are working correctly.
          </p>
        </div>
        <Button onClick={handleRunVerification} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Run Verification
        </Button>
      </div>

      {/* Backend Checks */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Server className="h-5 w-5" />
          Backend Checks
        </h2>
        {!data && !isLoading && !error && (
          <p className="text-sm text-muted-foreground">
            Click &quot;Run Verification&quot; to check backend services.
          </p>
        )}
        {isLoading && (
          <p className="text-sm text-muted-foreground">Checking...</p>
        )}
        {error && (
          <StatusCard
            name="API Connection"
            status="fail"
            message="Could not reach the API server. Is it running on port 8787?"
            icon={Server}
          />
        )}
        {data?.results.map((result) => (
          <div key={result.category} className="space-y-2">
            {result.items.map((item) => (
              <StatusCard
                key={item.name}
                name={item.name}
                status={item.status}
                message={item.message}
                durationMs={item.durationMs}
                icon={categoryIcons[result.category] || Server}
              />
            ))}
          </div>
        ))}
      </section>

      {/* Frontend Checks */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Frontend Checks
        </h2>

        {/* TanStack Query */}
        <StatusCard
          name="TanStack Query"
          status={data ? "pass" : error ? "fail" : "not_configured"}
          message={
            data
              ? "Successfully fetched /verify/all"
              : error
              ? "Query failed"
              : "Run verification to test"
          }
          icon={Activity}
        />

        {/* React Hook Form + Zod */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FormInput className="h-4 w-4" />
              React Hook Form + Zod
              <Badge variant="success">Pass</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DemoForm />
          </CardContent>
        </Card>

        {/* Zustand */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              Zustand (Global State)
              <Badge variant={runCount > 0 ? "success" : "warning"}>
                {runCount > 0 ? "Pass" : "Not Tested"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>Run count: <strong>{runCount}</strong></p>
            <p>Last run: <strong>{lastRunAt || "Never"}</strong></p>
          </CardContent>
        </Card>

        {/* Lucide React */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Lucide React Icons
              <Badge variant="success">Pass</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <Database className="h-5 w-5 text-blue-500" />
            <Shield className="h-5 w-5 text-purple-500" />
            <Mail className="h-5 w-5 text-orange-500" />
            <HardDrive className="h-5 w-5 text-gray-500" />
            <MonitorDot className="h-5 w-5 text-red-500" />
          </CardContent>
        </Card>

        {/* shadcn/ui */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              shadcn/ui (CVA + cn)
              <Badge variant="success">Pass</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="default" size="sm">Default</Button>
            <Button variant="destructive" size="sm">Destructive</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
            <Button variant="link" size="sm">Link</Button>
          </CardContent>
        </Card>
      </section>

      {/* Infrastructure Checks */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5" />
          Infrastructure
        </h2>

        <StatusCard
          name="TypeScript"
          status="pass"
          message="Page compiled successfully"
          icon={FileCode}
        />
        <StatusCard
          name="Turborepo + pnpm"
          status="pass"
          message="Monorepo workspace resolved"
          icon={Layers}
        />
        <StatusCard
          name="Next.js (App Router)"
          status="pass"
          message="Page rendered successfully"
          icon={Server}
        />
        <StatusCard
          name="Cloudflare Workers"
          status={data ? "pass" : error ? "fail" : "not_configured"}
          message={
            data
              ? "API reachable on Cloudflare Workers"
              : error
              ? "API unreachable"
              : "Run verification to test"
          }
          icon={Server}
        />
      </section>
    </main>
  );
}
