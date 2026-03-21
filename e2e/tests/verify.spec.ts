import { test, expect } from "@playwright/test";

test.describe("Verification Dashboard", () => {
  test("renders the verification page", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText("Tech Stack Verification")).toBeVisible();
  });

  test("has backend, frontend, and infrastructure sections", async ({
    page,
  }) => {
    await page.goto("/verify");
    await expect(page.getByText("Backend Checks")).toBeVisible();
    await expect(page.getByText("Frontend Checks")).toBeVisible();
    await expect(page.getByText("Infrastructure")).toBeVisible();
  });

  test("demo form validates and submits", async ({ page }) => {
    await page.goto("/verify");

    // Submit empty form to trigger validation
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("Valid email required")).toBeVisible();

    // Fill in valid data
    await page.getByLabel("Email").fill("test@example.com");
    await page.getByLabel("Name").fill("John Doe");
    await page.getByRole("button", { name: "Submit" }).click();

    await expect(page.getByText("Form validated successfully!")).toBeVisible();
  });

  test("zustand counter increments on verification run", async ({ page }) => {
    await page.goto("/verify");
    await expect(page.getByText("Run count: 0")).toBeVisible();

    await page.getByRole("button", { name: "Run Verification" }).click();
    await expect(page.getByText("Run count: 1")).toBeVisible();
  });
});
