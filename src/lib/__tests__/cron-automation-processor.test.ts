import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAutomationFindMany = vi.hoisted(() => vi.fn());
const mockStepUpdate = vi.hoisted(() => vi.fn());
const mockStepFindMany = vi.hoisted(() => vi.fn());
const mockSubscriberFindMany = vi.hoisted(() => vi.fn());
const mockSubscriberFindUnique = vi.hoisted(() => vi.fn());
const mockCampaignEventCreate = vi.hoisted(() => vi.fn());
const mockEmailLogCreate = vi.hoisted(() => vi.fn());
const mockAutomationFindManyWithInclude = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    automation: { findMany: mockAutomationFindMany },
    automationStep: { update: mockStepUpdate, findMany: mockStepFindMany },
    subscriber: { findMany: mockSubscriberFindMany, findUnique: mockSubscriberFindUnique },
    campaignEvent: { create: mockCampaignEventCreate },
    emailLog: { create: mockEmailLogCreate },
  },
}));

const mockSendEmail = vi.hoisted(() => vi.fn());
const mockPersonalizeContent = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email", () => ({
  sendEmail: mockSendEmail,
  personalizeContent: mockPersonalizeContent,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeAutomation(overrides = {}) {
  return {
    id: "auto-1",
    triggerType: "welcome_series",
    status: "ACTIVE",
    campaignId: null,
    steps: [
      { id: "step-1", stepOrder: 0, delayDays: 0, delayHours: 1, subject: "Welcome", content: "<p>Hi</p>", condition: {}, automation: { campaign: null }, ...overrides.steps?.[0] },
    ],
    ...overrides,
  };
}

describe("processWelcomeSeries", () => {
  it("schedules welcome steps with correct delays", async () => {
    const { processWelcomeSeries } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([
      {
        ...makeAutomation(),
        steps: [
          { id: "step-1", delayDays: 0, delayHours: 1, condition: {}, stepOrder: 0 },
          { id: "step-2", delayDays: 1, delayHours: 0, condition: {}, stepOrder: 1 },
        ],
      },
    ]);

    await processWelcomeSeries("sub-1");

    expect(mockStepUpdate).toHaveBeenCalledTimes(2);
    const firstCall = mockStepUpdate.mock.calls[0][0];
    expect(firstCall.where.id).toBe("step-1");
    expect(firstCall.data.condition._scheduledFor).toBe("sub-1");
  });

  it("handles empty automations gracefully", async () => {
    const { processWelcomeSeries } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([]);

    await processWelcomeSeries("sub-1");

    expect(mockStepUpdate).not.toHaveBeenCalled();
  });

  it("handles multiple automations", async () => {
    const { processWelcomeSeries } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([
      makeAutomation({ id: "auto-1", steps: [{ id: "step-1", delayDays: 0, delayHours: 0, condition: {}, stepOrder: 0 }] }),
      makeAutomation({ id: "auto-2", steps: [{ id: "step-2", delayDays: 0, delayHours: 0, condition: {}, stepOrder: 0 }] }),
    ]);

    await processWelcomeSeries("sub-1");

    expect(mockStepUpdate).toHaveBeenCalledTimes(2);
  });
});

describe("processTagAutomation", () => {
  it("schedules tag-based automation steps", async () => {
    const { processTagAutomation } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([
      {
        ...makeAutomation(),
        triggerType: "tag_added",
        steps: [{ id: "step-3", delayDays: 2, delayHours: 0, condition: {}, stepOrder: 0 }],
      },
    ]);

    await processTagAutomation("sub-1", "new-tag");

    expect(mockStepUpdate).toHaveBeenCalledTimes(1);
    expect(mockStepUpdate.mock.calls[0][0].data.condition._scheduledFor).toBe("sub-1");
  });

  it("handles no matching automations", async () => {
    const { processTagAutomation } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([]);

    await processTagAutomation("sub-1", "some-tag");

    expect(mockStepUpdate).not.toHaveBeenCalled();
  });
});

describe("processReEngagement", () => {
  it("returns early when no re-engagement automations exist", async () => {
    const { processReEngagement } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([]);

    await processReEngagement();

    expect(mockSubscriberFindMany).not.toHaveBeenCalled();
  });

  it("finds inactive subscribers and schedules steps", async () => {
    const { processReEngagement } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([
      {
        ...makeAutomation(),
        triggerType: "re_engagement",
        steps: [{ id: "step-re", delayDays: 0, delayHours: 0, condition: {}, stepOrder: 0 }],
      },
    ]);
    mockSubscriberFindMany.mockResolvedValue([
      { id: "sub-inactive-1", email: "a@b.com", status: "ACTIVE" },
      { id: "sub-inactive-2", email: "c@d.com", status: "ACTIVE" },
    ]);

    await processReEngagement();

    expect(mockSubscriberFindMany).toHaveBeenCalledWith({
      where: { status: "ACTIVE", lastOpenedAt: { lt: expect.any(Date) } },
      take: 100,
    });
    expect(mockStepUpdate).toHaveBeenCalledTimes(2);
  });

  it("handles multiple automations and subscribers", async () => {
    const { processReEngagement } = await import("../cron/automation-processor");
    mockAutomationFindMany.mockResolvedValue([
      {
        ...makeAutomation(),
        id: "auto-re-1",
        triggerType: "re_engagement",
        steps: [{ id: "step-re-1", delayDays: 0, delayHours: 0, condition: {}, stepOrder: 0 }],
      },
      {
        ...makeAutomation(),
        id: "auto-re-2",
        triggerType: "re_engagement",
        steps: [{ id: "step-re-2", delayDays: 1, delayHours: 0, condition: {}, stepOrder: 0 }],
      },
    ]);
    mockSubscriberFindMany.mockResolvedValue([{ id: "sub-1", email: "a@b.com", status: "ACTIVE" }]);

    await processReEngagement();

    expect(mockStepUpdate).toHaveBeenCalledTimes(2);
  });
});

describe("processAutomationQueue", () => {
  it("processes due steps and sends emails", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    const subscriber = { id: "sub-1", email: "test@test.com", firstName: "Test", status: "ACTIVE" };
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello {{first_name}}",
        content: "<p>Welcome</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);
    mockSubscriberFindUnique.mockResolvedValue(subscriber);
    mockPersonalizeContent.mockImplementation((s: string) => s.replace("{{first_name}}", "Test"));
    mockSendEmail.mockResolvedValue({ success: true, data: { id: "resend-1" }, error: null });

    await processAutomationQueue();

    expect(mockPersonalizeContent).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "test@test.com",
      subject: "Hello Test",
      html: "<p>Welcome</p>",
      campaignId: undefined,
      subscriberId: "sub-1",
    });
    expect(mockEmailLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "sent", subscriberId: "sub-1" }),
    });
  });

  it("skips step without _scheduledFor", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello",
        content: "<p>Welcome</p>",
        condition: { _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);

    await processAutomationQueue();

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips step without subject", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: null,
        content: "<p>Welcome</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);

    await processAutomationQueue();

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips step without content", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello",
        content: null,
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);

    await processAutomationQueue();

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips step when subscriber not found", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello",
        content: "<p>Welcome</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);
    mockSubscriberFindUnique.mockResolvedValue(null);

    await processAutomationQueue();

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("skips step when subscriber is not ACTIVE", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello",
        content: "<p>Welcome</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);
    mockSubscriberFindUnique.mockResolvedValue({ id: "sub-1", status: "UNSUBSCRIBED" });

    await processAutomationQueue();

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("creates campaign event when campaignId exists on send success", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    const subscriber = { id: "sub-1", email: "test@test.com", firstName: "Test", status: "ACTIVE" };
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello",
        content: "<p>Hi</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: "camp-1", campaign: { id: "camp-1" } },
      },
    ]);
    mockSubscriberFindUnique.mockResolvedValue(subscriber);
    mockPersonalizeContent.mockImplementation((s: string) => s);
    mockSendEmail.mockResolvedValue({ success: true, data: { id: "resend-1" }, error: null });

    await processAutomationQueue();

    expect(mockCampaignEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        campaignId: "camp-1",
        subscriberId: "sub-1",
        eventType: "sent",
      }),
    });
  });

  it("logs failed email attempts", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    const subscriber = { id: "sub-1", email: "test@test.com", firstName: "Test", status: "ACTIVE" };
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello",
        content: "<p>Hi</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);
    mockSubscriberFindUnique.mockResolvedValue(subscriber);
    mockPersonalizeContent.mockImplementation((s: string) => s);
    mockSendEmail.mockResolvedValue({ success: false, data: null, error: "SMTP error" });

    await processAutomationQueue();

    expect(mockEmailLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "failed", error: "SMTP error" }),
    });
  });

  it("cleans up condition after processing", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    const subscriber = { id: "sub-1", email: "test@test.com", firstName: "Test", status: "ACTIVE" };
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-1",
        subject: "Hello",
        content: "<p>Hi</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString(), otherField: "keep" },
        automation: { campaignId: null, campaign: null },
      },
    ]);
    mockSubscriberFindUnique.mockResolvedValue(subscriber);
    mockPersonalizeContent.mockImplementation((s: string) => s);
    mockSendEmail.mockResolvedValue({ success: true, data: null, error: null });

    await processAutomationQueue();

    const stepUpdate = mockStepUpdate.mock.calls.find(
      (c: unknown[]) => (c[0] as Record<string, unknown>)?.where?.id === "step-1"
    );
    const cleanedCondition = stepUpdate?.[0]?.data?.condition;
    expect(cleanedCondition._scheduledFor).toBeUndefined();
    expect(cleanedCondition._executeAt).toBeUndefined();
    expect(cleanedCondition.otherField).toBe("keep");
  });

  it("handles errors in individual step processing", async () => {
    const { processAutomationQueue } = await import("../cron/automation-processor");
    mockStepFindMany.mockResolvedValue([
      {
        id: "step-error",
        subject: "Hello",
        content: "<p>Hi</p>",
        condition: { _scheduledFor: "sub-1", _executeAt: new Date().toISOString() },
        automation: { campaignId: null, campaign: null },
      },
    ]);
    mockSubscriberFindUnique.mockRejectedValue(new Error("Unexpected error"));

    await expect(processAutomationQueue()).resolves.not.toThrow();
  });
});
