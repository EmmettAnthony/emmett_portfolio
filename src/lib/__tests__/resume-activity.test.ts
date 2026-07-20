import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockLogActivity = vi.fn();

vi.mock("@/../auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/activity", () => ({
  logActivity: (...args: unknown[]) => mockLogActivity(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1" } });
  mockLogActivity.mockResolvedValue({ id: "log-1" });
});

describe("logResumeActivity", () => {
  it("logs a resume activity", async () => {
    const { logResumeActivity } = await import("@/lib/resume-activity");
    await logResumeActivity("view", "Resume", "Viewed resume", "res-1");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "view",
        module: "resume",
        entity: "Resume",
        entityId: "res-1",
        description: "Viewed resume",
        userId: "user-1",
      })
    );
  });

  it("generates description when omitted", async () => {
    const { logResumeActivity } = await import("@/lib/resume-activity");
    await logResumeActivity("download", "Resume");

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({ description: "download Resume" })
    );
  });

  it("does not log when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const { logResumeActivity } = await import("@/lib/resume-activity");
    await logResumeActivity("view", "Resume");

    expect(mockLogActivity).not.toHaveBeenCalled();
  });

  it("handles errors gracefully", async () => {
    mockLogActivity.mockRejectedValue(new Error("fail"));
    const { logResumeActivity } = await import("@/lib/resume-activity");
    await expect(logResumeActivity("view", "Resume")).resolves.not.toThrow();
  });
});
