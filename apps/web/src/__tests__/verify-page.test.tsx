import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import VerifyPage from "../app/verify/page";

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("VerifyPage", () => {
  it("renders the page title and section headings", () => {
    renderWithProviders(<VerifyPage />);

    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1.length).toBeGreaterThanOrEqual(1);
    expect(h1[0]).toHaveTextContent("Tech Stack Verification");

    const h2s = screen.getAllByRole("heading", { level: 2 });
    const texts = h2s.map((h) => h.textContent);
    expect(texts).toContain("Backend Checks");
    expect(texts).toContain("Frontend Checks");
    expect(texts).toContain("Infrastructure");
  });

  it("renders the Run Verification button", () => {
    renderWithProviders(<VerifyPage />);
    const buttons = screen.getAllByRole("button", { name: /Run Verification/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the demo form with email and name fields", () => {
    renderWithProviders(<VerifyPage />);
    const emails = screen.getAllByLabelText("Email");
    const names = screen.getAllByLabelText("Name");
    expect(emails.length).toBeGreaterThanOrEqual(1);
    expect(names.length).toBeGreaterThanOrEqual(1);
  });

  it("renders infrastructure items", () => {
    renderWithProviders(<VerifyPage />);
    expect(screen.getAllByText("TypeScript").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Turborepo + pnpm").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Next.js (App Router)").length).toBeGreaterThanOrEqual(1);
  });
});
