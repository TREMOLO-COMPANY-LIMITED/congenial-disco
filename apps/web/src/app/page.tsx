"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@starter/ui";
import { fetchApi } from "@/lib/api";
import type { HealthResponse } from "@starter/shared";

export default function Home() {
  const { data, isLoading, error } = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: () => fetchApi<HealthResponse>("/health"),
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">Starter</h1>

      <div className="mt-4 text-center">
        <p className="text-muted-foreground">API Status:</p>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">API unreachable</p>}
        {data && (
          <p className="text-green-500">
            {data.status} - {data.timestamp}
          </p>
        )}
      </div>

      <Button variant="default">Get Started</Button>
    </main>
  );
}
