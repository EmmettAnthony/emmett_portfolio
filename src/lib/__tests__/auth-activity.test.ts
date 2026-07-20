import { describe, it, expect, vi, beforeEach } from "vitest";

const mockLogActivity = vi.fn();
const mockTrackUserSession = vi.fn();
const mockAutoLogSecurityEvent = vi.fn();
const mockPrismaActivityLogCount = vi.fn();
const mockPrismaUserSessionUpdateMany = vi.fn();

vi.mock("@/lib/activity", () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

vi.mock("@/lib/activity-logger", () => ({
  trackUserSession: (...args: unknown[]) => mockTrackUserSession(...args),
  autoLogSecurityEvent: (...args: unknown[]) => mockAutoLogSecurityEvent(...args),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    activityLog: {
      count: (...args: unknown[]) => mockPrismaActivityLogCount(...args),
    },
    userSession: {
      updateMany: (...args: unknown[]) => mockPrismaUserSessionUpdateMany(...args),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockLogActivity.mockResolvedValue({ id: "log-1" });
  mockTrackUserSession.mockResolvedValue(undefined);
  mockAutoLogSecurityEvent.mockResolvedValue(true);
  mockPrismaUserSessionUpdateMany.mockResolvedValue({ count: 1 });
});

describe("logSignIn", () => {
  it("logs a sign-in activity", async () => {
    const { logSignIn } = await import("@/lib/auth-activity");
    await logSignIn("user-1", "token-1", "1.2.3.4", "Chrome");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "login", module: "auth", userId: "user-1" })
    );
  });

  it("tracks session when sessionToken provided", async () => {
    const { logSignIn } = await import("@/lib/auth-activity");
    await logSignIn("user-1", "token-1");

    expect(mockTrackUserSession).toHaveBeenCalledWith("user-1", "token-1", undefined, undefined);
  });

  it("skips session tracking when no sessionToken", async () => {
    const { logSignIn } = await import("@/lib/auth-activity");
    await logSignIn("user-1");

    expect(mockTrackUserSession).not.toHaveBeenCalled();
  });
});

describe("logFailedSignIn", () => {
  it("logs a failed sign-in", async () => {
    const { logFailedSignIn } = await import("@/lib/auth-activity");
    await logFailedSignIn("test@user.com", "1.2.3.4", "Chrome");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "failed_login", severity: "WARNING" })
    );
  });

  it("checks brute force when IP provided", async () => {
    mockPrismaActivityLogCount.mockResolvedValue(3);
    const { logFailedSignIn, checkBruteForce } = await import("@/lib/auth-activity");
    await logFailedSignIn("test@user.com", "1.2.3.4");
  });

  it("skips brute force check without IP", async () => {
    const { logFailedSignIn } = await import("@/lib/auth-activity");
    await logFailedSignIn("test@user.com");
    expect(mockAutoLogSecurityEvent).not.toHaveBeenCalled();
  });
});

describe("logSignOut", () => {
  it("logs sign-out and ends session", async () => {
    const { logSignOut } = await import("@/lib/auth-activity");
    await logSignOut("user-1", "token-1");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "logout", userId: "user-1" })
    );
    expect(mockPrismaUserSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionToken: "token-1", isActive: true },
      })
    );
  });
});

describe("logPasswordChange", () => {
  it("logs password change", async () => {
    const { logPasswordChange } = await import("@/lib/auth-activity");
    await logPasswordChange("user-1", "1.2.3.4");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "password_change", userId: "user-1" })
    );
  });
});

describe("logPasswordReset", () => {
  it("logs password reset", async () => {
    const { logPasswordReset } = await import("@/lib/auth-activity");
    await logPasswordReset("test@user.com", "1.2.3.4");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ action: "password_reset", description: expect.stringContaining("test@user.com") })
    );
  });
});

describe("checkBruteForce", () => {
  it("returns false without IP", async () => {
    const { checkBruteForce } = await import("@/lib/auth-activity");
    const result = await checkBruteForce("test@user.com");
    expect(result).toBe(false);
    expect(mockAutoLogSecurityEvent).not.toHaveBeenCalled();
  });

  it("triggers security event when threshold exceeded", async () => {
    mockPrismaActivityLogCount.mockResolvedValue(10);
    const { checkBruteForce } = await import("@/lib/auth-activity");
    const result = await checkBruteForce("test@user.com", "1.2.3.4", 5);

    expect(result).toBe(true);
    expect(mockAutoLogSecurityEvent).toHaveBeenCalledWith(
      "suspicious_activity",
      expect.stringContaining("Brute force detected"),
      "CRITICAL",
      undefined,
      "1.2.3.4",
      expect.objectContaining({ attemptCount: 10 })
    );
  });

  it("does not trigger when under threshold", async () => {
    mockPrismaActivityLogCount.mockResolvedValue(3);
    const { checkBruteForce } = await import("@/lib/auth-activity");
    const result = await checkBruteForce("test@user.com", "1.2.3.4", 5);

    expect(result).toBe(false);
    expect(mockAutoLogSecurityEvent).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockPrismaActivityLogCount.mockRejectedValue(new Error("DB fail"));
    const { checkBruteForce } = await import("@/lib/auth-activity");
    const result = await checkBruteForce("test@user.com", "1.2.3.4");
    expect(result).toBe(false);
  });
});
