import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: [
    {
      command: "pnpm --filter @starter/api dev",
      port: 8787,
      reuseExistingServer: true,
      cwd: "..",
    },
    {
      command: "pnpm --filter @starter/web dev",
      port: 3000,
      reuseExistingServer: true,
      cwd: "..",
    },
  ],
});
