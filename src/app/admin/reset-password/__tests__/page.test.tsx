import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const t: Record<string, string> = {
      "invalidLink": "Invalid Reset Link",
      "invalidLinkDesc": "This password reset link is invalid or has expired.",
      "requestNewLink": "Request a new reset link",
      "passwordsDoNotMatch": "Passwords do not match",
      "passwordMinLength": "Password must be at least 8 characters",
      "somethingWentWrong": "Something went wrong",
      "errorOccurred": "An error occurred. Please try again.",
      "passwordReset": "Password Reset Successful",
      "passwordResetDesc": "Your password has been reset. Redirecting to login...",
      "title": "Reset your password",
      "subtitle": "Enter your new password below.",
      "newPassword": "New Password",
      "confirmPassword": "Confirm Password",
      "showPassword": "Show password",
      "hidePassword": "Hide password",
      "resetting": "Resetting...",
      "resetPassword": "Reset Password",
    };
    return t[key] || key;
  },
}));

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue("valid-token");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function renderPage() {
    const { default: Page } = await import("../page");
    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(React.createElement(Page));
    });
    return result!;
  }

  it("shows invalid link view when no token is present", async () => {
    mockGet.mockReturnValue(null);
    await renderPage();
    expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
    expect(screen.getByText("Request a new reset link")).toBeInTheDocument();
  });

  it("renders the reset password form when token is present", async () => {
    await renderPage();
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Password")).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different456");
    await user.click(screen.getByText("Reset Password"));
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("shows error when password is too short", async () => {
    const user = userEvent.setup();
    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "short");
    await user.type(screen.getByLabelText("Confirm Password"), "short");
    await user.click(screen.getByText("Reset Password"));
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  it("submits the form successfully and shows success view", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Password has been reset successfully." }),
    });
    global.fetch = mockFetch;

    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await user.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(screen.getByText("Password Reset Successful")).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "valid-token", password: "newpassword123" }),
    });
  });

  it("shows API error message on failed submission", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid or expired reset token" }),
    });
    global.fetch = mockFetch;

    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await user.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(screen.getByText("Invalid or expired reset token")).toBeInTheDocument();
    });
  });

  it("shows fallback error when API returns no error field", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    global.fetch = mockFetch;

    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await user.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("redirects to login after successful reset", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: "ok" }),
    });

    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await user.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(screen.getByText("Password Reset Successful")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
    }, { timeout: 6000 });
  }, 10000);

  it("shows generic error on network failure", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await user.click(screen.getByText("Reset Password"));

    await waitFor(() => {
      expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
    });
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    await renderPage();
    const passwordInput = screen.getByLabelText("New Password");
    expect(passwordInput).toHaveAttribute("type", "password");
    await user.click(screen.getByLabelText("Show password"));
    expect(passwordInput).toHaveAttribute("type", "text");
    await user.click(screen.getByLabelText("Hide password"));
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("disables submit button while loading", async () => {
    const user = userEvent.setup();
    let resolveFetch: (v: unknown) => void;
    global.fetch = vi.fn(() => new Promise((resolve) => { resolveFetch = resolve; }));

    await renderPage();
    await user.type(screen.getByLabelText("New Password"), "newpassword123");
    await user.type(screen.getByLabelText("Confirm Password"), "newpassword123");
    await user.click(screen.getByText("Reset Password"));

    expect(screen.getByText("Resetting...")).toBeInTheDocument();
    await act(async () => {
      resolveFetch!({
        ok: true,
        json: async () => ({ message: "ok" }),
      });
    });
  });
});
