import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VerifyEmailPage from "../page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

let mockSearchParams: { get: (key: string) => string | null };

describe("VerifyEmailPage", () => {
  it("shows check-email message with email address", () => {
    mockSearchParams = {
      get: (key: string) => (key === "email" ? "test@example.com" : null),
    };
    render(<VerifyEmailPage />);
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/メールを確認してください/)).toBeInTheDocument();
  });

  it("shows generic message when no email param", () => {
    mockSearchParams = { get: () => null };
    render(<VerifyEmailPage />);
    expect(screen.getByText(/メールを確認してください/)).toBeInTheDocument();
    expect(screen.getByText(/リンクをクリック/)).toBeInTheDocument();
  });

  it("has link to login page", () => {
    mockSearchParams = { get: () => null };
    render(<VerifyEmailPage />);
    const link = screen.getByRole("link", { name: /ログイン画面へ/ });
    expect(link).toHaveAttribute("href", "/auth/login");
  });
});
