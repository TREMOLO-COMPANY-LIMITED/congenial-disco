import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import VerifyEmailPage from "../page";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

let mockSearchParams: { get: (key: string) => string | null };

const mockVerifyEmail = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailVerification: {
      verifyEmail: (...args: unknown[]) => mockVerifyEmail(...args),
    },
  },
}));

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows check-email message when email param is present and no token", () => {
    mockSearchParams = {
      get: (key: string) => (key === "email" ? "test@example.com" : null),
    };
    render(<VerifyEmailPage />);
    expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    expect(screen.getByText(/メールを確認してください/)).toBeInTheDocument();
  });

  it("calls verifyEmail when token param is present", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "abc123" : null),
    };
    mockVerifyEmail.mockResolvedValue({ error: null });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith({
        query: { token: "abc123" },
      });
    });
  });

  it("redirects to login on successful verification", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "abc123" : null),
    };
    mockVerifyEmail.mockResolvedValue({ error: null });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login?verified=true");
    });
  });

  it("shows error on failed verification", async () => {
    mockSearchParams = {
      get: (key: string) => (key === "token" ? "bad-token" : null),
    };
    mockVerifyEmail.mockResolvedValue({
      error: { message: "Invalid token" },
    });
    render(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText("Invalid token")).toBeInTheDocument();
    });
  });
});
