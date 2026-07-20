import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRuleFindMany = vi.hoisted(() => vi.fn());
const mockTicketUpdate = vi.hoisted(() => vi.fn());
const mockTicketFindUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: {
    supportAutomationRule: { findMany: mockRuleFindMany },
    supportTicket: { update: mockTicketUpdate, findUnique: mockTicketFindUnique },
  },
}));

const mockSendNotification = vi.hoisted(() => vi.fn());
vi.mock("@/lib/notifications/notification-service", () => ({
  sendNotification: mockSendNotification,
}));

const ticket = {
  id: "ticket-1",
  subject: "Need help with login",
  description: "I cannot log in",
  email: "user@test.com",
  fullName: "John Doe",
  priorityId: "priority-1",
  categoryId: "category-1",
  statusId: "status-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runAutomationRules", () => {
  it("returns early when no matching rules", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([]);

    await runAutomationRules("ticket_created", ticket);

    expect(mockRuleFindMany).toHaveBeenCalledWith({
      where: { isEnabled: true, trigger: "ticket_created" },
      orderBy: { sortOrder: "asc" },
    });
    expect(mockTicketUpdate).not.toHaveBeenCalled();
  });

  it("evaluates conditions with equals operator and executes matching actions", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-1",
        name: "High Priority Auto-assign",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [
          { field: "priorityId", operator: "equals", value: "priority-1" },
        ],
        actions: [
          { type: "assign_to", value: "agent-1" },
        ],
      },
    ]);

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { assignedToId: "agent-1" },
    });
  });

  it("skips rule when conditions do not match", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-1",
        name: "Skip rule",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [
          { field: "priorityId", operator: "equals", value: "priority-99" },
        ],
        actions: [
          { type: "assign_to", value: "agent-1" },
        ],
      },
    ]);

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).not.toHaveBeenCalled();
  });

  it("evaluates conditions with contains operator", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-2",
        name: "Urgent contains",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [
          { field: "subject", operator: "contains", value: "login" },
        ],
        actions: [
          { type: "change_priority", value: "priority-urgent" },
        ],
      },
    ]);

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { priorityId: "priority-urgent" },
    });
  });

  it("contains operator is case insensitive", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-3",
        name: "Case insensitive",
        trigger: "ticket_updated",
        isEnabled: true,
        sortOrder: 1,
        conditions: [
          { field: "subject", operator: "contains", value: "LOGIN" },
        ],
        actions: [
          { type: "change_status", value: "status-reviewed" },
        ],
      },
    ]);

    await runAutomationRules("ticket_updated", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { statusId: "status-reviewed" },
    });
  });

  it("defaults to no match for unknown operator", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-4",
        name: "Unknown op",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [
          { field: "statusId", operator: "regex", value: ".*" },
        ],
        actions: [
          { type: "change_status", value: "status-new" },
        ],
      },
    ]);

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).not.toHaveBeenCalled();
  });

  it("handles add_tag action by appending to existing tags", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-5",
        name: "Tag rule",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [
          { field: "priorityId", operator: "equals", value: "priority-1" },
        ],
        actions: [
          { type: "add_tag", value: "high-priority" },
        ],
      },
    ]);
    mockTicketFindUnique.mockResolvedValue({ tags: '["bug","frontend"]' });

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { tags: '["bug","frontend","high-priority"]' },
    });
  });

  it("handles add_tag when tags is an empty array", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-6",
        name: "First tag",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [],
        actions: [
          { type: "add_tag", value: "auto-tagged" },
        ],
      },
    ]);
    mockTicketFindUnique.mockResolvedValue({ tags: "[]" });

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { tags: '["auto-tagged"]' },
    });
  });

  it("handles add_tag when tags is null", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-7",
        name: "Null tags",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [],
        actions: [
          { type: "add_tag", value: "new-tag" },
        ],
      },
    ]);
    mockTicketFindUnique.mockResolvedValue({ tags: null });

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { tags: '["new-tag"]' },
    });
  });

  it("does not add duplicate tags", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-8",
        name: "No duplicate",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [],
        actions: [
          { type: "add_tag", value: "existing" },
        ],
      },
    ]);
    mockTicketFindUnique.mockResolvedValue({ tags: '["existing"]' });

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledWith({
      where: { id: "ticket-1" },
      data: { tags: '["existing"]' },
    });
  });

  it("handles notify action", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-9",
        name: "Notify agent",
        trigger: "ticket_escalated",
        isEnabled: true,
        sortOrder: 1,
        conditions: [],
        actions: [
          { type: "notify", value: "" },
        ],
      },
    ]);
    mockSendNotification.mockResolvedValue({ success: true });

    await runAutomationRules("ticket_escalated", ticket);

    expect(mockSendNotification).toHaveBeenCalledWith({
      eventKey: "support.rule.ticket_escalated",
      title: "Automation: Notify agent",
      message: 'Rule "Notify agent" triggered on ticket Need help with login',
      link: "/dashboard/support/tickets/ticket-1",
      source: "support",
      categoryOverride: "SUPPORT",
    });
  });

  it("executes multiple actions for a matching rule", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-10",
        name: "Multi action",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [],
        actions: [
          { type: "change_status", value: "status-2" },
          { type: "change_priority", value: "priority-2" },
        ],
      },
    ]);

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledTimes(2);
    expect(mockTicketUpdate).toHaveBeenNthCalledWith(1, {
      where: { id: "ticket-1" },
      data: { statusId: "status-2" },
    });
    expect(mockTicketUpdate).toHaveBeenNthCalledWith(2, {
      where: { id: "ticket-1" },
      data: { priorityId: "priority-2" },
    });
  });

  it("processes multiple rules in sort order", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-first",
        name: "First",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [],
        actions: [{ type: "change_status", value: "status-1" }],
      },
      {
        id: "rule-second",
        name: "Second",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 2,
        conditions: [],
        actions: [{ type: "change_priority", value: "priority-1" }],
      },
    ]);

    await runAutomationRules("ticket_created", ticket);

    expect(mockTicketUpdate).toHaveBeenCalledTimes(2);
    expect(mockTicketUpdate.mock.calls[0][0].data).toEqual({ statusId: "status-1" });
    expect(mockTicketUpdate.mock.calls[1][0].data).toEqual({ priorityId: "priority-1" });
  });

  it("handles rule processing error gracefully and continues", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-error",
        name: "Error rule",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [{ field: "priorityId", operator: "equals", value: "nonexistent" }],
        actions: [{ type: "nonexistent_action", value: "x" }],
      },
    ]);

    await expect(runAutomationRules("ticket_created", ticket)).resolves.not.toThrow();
  });

  it("handles ticket field being null/empty gracefully", async () => {
    const { runAutomationRules } = await import("../support/automation-engine");
    mockRuleFindMany.mockResolvedValue([
      {
        id: "rule-null",
        name: "Null field",
        trigger: "ticket_created",
        isEnabled: true,
        sortOrder: 1,
        conditions: [
          { field: "nonexistentField", operator: "equals", value: "something" },
        ],
        actions: [{ type: "assign_to", value: "agent-1" }],
      },
    ]);
    const ticketWithNulls = { ...ticket, priorityId: null, categoryId: null, statusId: null };

    await runAutomationRules("ticket_created", ticketWithNulls);

    expect(mockTicketUpdate).not.toHaveBeenCalled();
  });
});
