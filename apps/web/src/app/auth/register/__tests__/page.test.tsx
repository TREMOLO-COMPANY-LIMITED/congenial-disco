import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterPage from "../page";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock auth client
const mockSignUp = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: (...args: unknown[]) => mockSignUp(...args),
    },
  },
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all form fields", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText("名前")).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード（確認）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登録" })).toBeInTheDocument();
  });

  it("shows validation errors for empty form submission", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);
    await user.click(screen.getByRole("button", { name: "登録" }));
    await waitFor(() => {
      expect(screen.getByText("名前を入力してください")).toBeInTheDocument();
    });
  });

  it("calls signUp on valid submission and redirects", async () => {
    mockSignUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("名前"), "Test User");
    await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
    await user.type(screen.getByLabelText("パスワード"), "Password1");
    await user.type(screen.getByLabelText("パスワード（確認）"), "Password1");
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        name: "Test User",
        email: "test@example.com",
        password: "Password1",
      });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/auth/verify-email?email=test%40example.com"
      );
    });
  });

  it("displays API error message", async () => {
    mockSignUp.mockResolvedValue({
      error: { message: "Email already exists" },
    });
    const user = userEvent.setup();
    render(<RegisterPage />);

    await user.type(screen.getByLabelText("名前"), "Test User");
    await user.type(screen.getByLabelText("メールアドレス"), "test@example.com");
    await user.type(screen.getByLabelText("パスワード"), "Password1");
    await user.type(screen.getByLabelText("パスワード（確認）"), "Password1");
    await user.click(screen.getByRole("button", { name: "登録" }));

    await waitFor(() => {
      expect(screen.getByText("Email already exists")).toBeInTheDocument();
    });
  });

  it("has link to login page", () => {
    render(<RegisterPage />);
    const link = screen.getByRole("link", { name: /ログイン/ });
    expect(link).toHaveAttribute("href", "/auth/login");
  });
});
