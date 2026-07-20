import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReminderFindMany = vi.hoisted(() => vi.fn());
const mockNotificationCreate = vi.hoisted(() => vi.fn());
const mockReminderCreate = vi.hoisted(() => vi.fn());
const mockCalendarEventCreate = vi.hoisted(() => vi.fn());
const mockCalendarEventUpdate = vi.hoisted(() => vi.fn());
const mockReminderUpdate = vi.hoisted(() => vi.fn());
const mockAppointmentFindMany = vi.hoisted(() => vi.fn());
const mockAppointmentUpdate = vi.hoisted(() => vi.fn());
const mockAppointmentLogCreate = vi.hoisted(() => vi.fn());

const mockGetPrisma = vi.hoisted(() => vi.fn(() => ({
  reminder: {
    findMany: mockReminderFindMany,
    create: mockReminderCreate,
    update: mockReminderUpdate,
  },
  notification: { create: mockNotificationCreate },
  calendarEvent: {
    create: mockCalendarEventCreate,
    update: mockCalendarEventUpdate,
  },
  appointment: {
    findMany: mockAppointmentFindMany,
    update: mockAppointmentUpdate,
  },
  appointmentLog: { create: mockAppointmentLogCreate },
})));

vi.mock("@/lib/db", () => ({
  getPrisma: mockGetPrisma,
}));

const mockEmailsSend = vi.hoisted(() => vi.fn());
const mockGetResend = vi.hoisted(() => vi.fn(() => ({
  emails: { send: mockEmailsSend },
})));

vi.mock("@/lib/resend", () => ({
  getResend: mockGetResend,
}));

const mockAppointmentReminderTemplate = vi.hoisted(() => vi.fn());
const mockCustomReminderTemplate = vi.hoisted(() => vi.fn());
vi.mock("@/lib/email/templates", () => ({
  appointmentReminderTemplate: mockAppointmentReminderTemplate,
  customReminderTemplate: mockCustomReminderTemplate,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("processPendingReminders", () => {
  it("throws when prisma initialization fails (outside try block)", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockGetPrisma.mockImplementationOnce(() => {
      throw new Error("Connection failed");
    });

    await expect(processPendingReminders()).rejects.toThrow("Connection failed");
  });

  it("processes no reminders when none are pending", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([]);

    const result = await processPendingReminders();

    expect(result).toEqual({ processed: 0, emailed: 0, notified: 0, errors: [] });
  });

  it("sends email for EMAIL type and creates notification for DASHBOARD type", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-1",
        title: "Test Reminder",
        description: "Description here",
        remindAt: new Date(),
        remindType: "EMAIL",
        status: "PENDING",
        relatedType: "MEETING",
        relatedId: null,
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
      {
        id: "rem-2",
        title: "Dashboard Notification",
        description: "Dashboard desc",
        remindAt: new Date(),
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: "TASK",
        relatedId: "task-1",
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);
    mockCustomReminderTemplate.mockReturnValue({ subject: "Reminder: Test", html: "<p>Test</p>" });
    mockEmailsSend.mockResolvedValue({});

    const result = await processPendingReminders();

    expect(result.processed).toBe(2);
    expect(result.emailed).toBe(1);
    expect(result.notified).toBe(1);
    expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
    expect(mockReminderUpdate).toHaveBeenCalledTimes(2);
  });

  it("processes BOTH type - sends email and creates notification", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-3",
        title: "Both Type",
        description: "Both desc",
        remindAt: new Date(),
        remindType: "BOTH",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);
    mockCustomReminderTemplate.mockReturnValue({ subject: "Both", html: "<p>Both</p>" });
    mockEmailsSend.mockResolvedValue({});

    const result = await processPendingReminders();

    expect(result.processed).toBe(1);
    expect(result.emailed).toBe(1);
    expect(result.notified).toBe(1);
  });

  it("defaults remindType to DASHBOARD when not set", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-4",
        title: "No Type",
        description: null,
        remindAt: new Date(),
        remindType: null,
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);

    const result = await processPendingReminders();

    expect(result.processed).toBe(1);
    expect(result.emailed).toBe(0);
    expect(result.notified).toBe(1);
  });

  it("handles email send failure gracefully", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-5",
        title: "Fail Email",
        description: "Desc",
        remindAt: new Date(),
        remindType: "EMAIL",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);
    mockCustomReminderTemplate.mockReturnValue({ subject: "Fail", html: "<p>Fail</p>" });
    mockEmailsSend.mockRejectedValue(new Error("Resend error"));

    const result = await processPendingReminders();

    expect(result.emailed).toBe(0);
    expect(result.processed).toBe(1);
    expect(result.errors[0]).toContain("Email failed for reminder rem-5");
  });

  it("handles notification creation failure gracefully", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-6",
        title: "Fail Notif",
        description: "Desc",
        remindAt: new Date(),
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);
    mockNotificationCreate.mockRejectedValue(new Error("Notif error"));

    const result = await processPendingReminders();

    expect(result.notified).toBe(0);
    expect(result.processed).toBe(1);
  });

  it("creates next reminder for daily repeat without repeatUntil", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const now = new Date("2026-07-17T10:00:00Z");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-repeat",
        title: "Daily Repeat",
        description: null,
        remindAt: now,
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: "daily",
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);

    const result = await processPendingReminders();

    expect(result.processed).toBe(1);
    expect(mockReminderCreate).toHaveBeenCalledTimes(1);
    const createdReminder = mockReminderCreate.mock.calls[0][0].data;
    expect(createdReminder.repeatInterval).toBe("daily");
    expect(createdReminder.status).toBe("PENDING");
    expect(mockCalendarEventCreate).toHaveBeenCalledTimes(1);
  });

  it("skips creating next repeat when repeatUntil is past", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const pastDate = new Date("2026-07-16T10:00:00Z");
    const repeatUntil = new Date("2026-07-10T10:00:00Z");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-expired",
        title: "Expired Repeat",
        description: null,
        remindAt: pastDate,
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: "weekly",
        repeatUntil,
        sentAt: null,
        events: [],
      },
    ]);

    const result = await processPendingReminders();

    expect(result.processed).toBe(1);
    expect(mockReminderCreate).not.toHaveBeenCalled();
    expect(mockCalendarEventCreate).not.toHaveBeenCalled();
  });

  it("updates associated calendar event status to COMPLETED", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-event",
        title: "With Event",
        description: null,
        remindAt: new Date(),
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [{ id: "event-1", eventType: "REMINDER" }],
      },
    ]);

    const result = await processPendingReminders();

    expect(result.processed).toBe(1);
    expect(mockCalendarEventUpdate).toHaveBeenCalledWith({
      where: { id: "event-1" },
      data: { status: "COMPLETED" },
    });
  });

  it("catches per-reminder errors and continues", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-error",
        title: "Error",
        description: null,
        remindAt: new Date(),
        remindType: null,
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: null,
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);
    mockNotificationCreate.mockRejectedValue(new Error("Unexpected"));

    const result = await processPendingReminders();

    expect(result.processed).toBe(1);
    mockReminderUpdate.mockClear();
  });

  it("handles repeat intervals: daily, weekly, monthly, yearly", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const baseDate = new Date("2026-01-15T00:00:00Z");
    const intervals = ["daily", "weekly", "monthly", "yearly"];

    for (const interval of intervals) {
      mockReminderFindMany.mockResolvedValue([
        {
          id: `rem-${interval}`,
          title: interval,
          description: null,
          remindAt: baseDate,
          remindType: "DASHBOARD",
          status: "PENDING",
          relatedType: null,
          relatedId: null,
          repeatInterval: interval,
          repeatUntil: null,
          sentAt: null,
          events: [],
        },
      ]);

      await processPendingReminders();
    }

    expect(mockReminderCreate).toHaveBeenCalledTimes(4);
  });
});

describe("calculateNextRepeat", () => {
  it("adds 1 day for daily interval", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const baseDate = new Date("2026-01-15T00:00:00Z");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-calc",
        title: "Calc",
        description: null,
        remindAt: baseDate,
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: "daily",
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);

    await processPendingReminders();

    const created = mockReminderCreate.mock.calls[0][0].data;
    const nextDay = new Date(created.remindAt);
    expect(nextDay.getUTCDate()).toBe(16);
  });

  it("adds 7 days for weekly interval", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const baseDate = new Date("2026-01-15T00:00:00Z");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-weekly",
        title: "Weekly",
        description: null,
        remindAt: baseDate,
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: "weekly",
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);

    await processPendingReminders();

    const created = mockReminderCreate.mock.calls[0][0].data;
    const nextWeek = new Date(created.remindAt);
    expect(nextWeek.getUTCDate()).toBe(22);
  });

  it("adds 1 month for monthly interval", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const baseDate = new Date("2026-01-15T00:00:00Z");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-monthly",
        title: "Monthly",
        description: null,
        remindAt: baseDate,
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: "monthly",
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);

    await processPendingReminders();

    const created = mockReminderCreate.mock.calls[0][0].data;
    const nextMonth = new Date(created.remindAt);
    expect(nextMonth.getUTCMonth()).toBe(1);
  });

  it("adds 1 year for yearly interval", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const baseDate = new Date("2026-01-15T00:00:00Z");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-yearly",
        title: "Yearly",
        description: null,
        remindAt: baseDate,
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: "yearly",
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);

    await processPendingReminders();

    const created = mockReminderCreate.mock.calls[0][0].data;
    const nextYear = new Date(created.remindAt);
    expect(nextYear.getUTCFullYear()).toBe(2027);
  });

  it("defaults to daily for unknown interval", async () => {
    const { processPendingReminders } = await import("../cron/reminder-processor");
    const baseDate = new Date("2026-01-15T00:00:00Z");
    mockReminderFindMany.mockResolvedValue([
      {
        id: "rem-unknown",
        title: "Unknown",
        description: null,
        remindAt: baseDate,
        remindType: "DASHBOARD",
        status: "PENDING",
        relatedType: null,
        relatedId: null,
        repeatInterval: "biweekly",
        repeatUntil: null,
        sentAt: null,
        events: [],
      },
    ]);

    await processPendingReminders();

    const created = mockReminderCreate.mock.calls[0][0].data;
    const nextDay = new Date(created.remindAt);
    expect(nextDay.getUTCDate()).toBe(16);
  });
});

describe("processAppointmentReminders", () => {
  it("throws when prisma initialization fails (outside try block)", async () => {
    const { processAppointmentReminders } = await import("../cron/reminder-processor");
    mockGetPrisma.mockImplementationOnce(() => {
      throw new Error("DB error");
    });

    await expect(processAppointmentReminders()).rejects.toThrow("DB error");
  });

  it("processes no appointments when none are due", async () => {
    const { processAppointmentReminders } = await import("../cron/reminder-processor");
    mockAppointmentFindMany.mockResolvedValue([]);

    const result = await processAppointmentReminders();

    expect(result.remindersSent).toBe(0);
    expect(result.errors).toEqual([]);
  });

  it("sends reminder for upcoming appointment and updates record", async () => {
    const { processAppointmentReminders } = await import("../cron/reminder-processor");
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockAppointmentFindMany.mockResolvedValue([
      {
        id: "apt-1",
        name: "John Doe",
        email: "john@test.com",
        preferredDate: tomorrow,
        preferredTime: "10:00",
        duration: 60,
        timezone: "America/New_York",
        meetingType: { name: "Consultation" },
        status: "CONFIRMED",
        reminderSent: false,
      },
    ]);
    mockAppointmentReminderTemplate.mockReturnValue({ subject: "Reminder", html: "<p>Reminder</p>" });
    mockEmailsSend.mockResolvedValue({});
    mockAppointmentUpdate.mockResolvedValue({});
    mockAppointmentLogCreate.mockResolvedValue({});

    const result = await processAppointmentReminders();

    expect(result.remindersSent).toBe(1);
    expect(mockAppointmentReminderTemplate).toHaveBeenCalledWith({
      name: "John Doe",
      date: tomorrow,
      time: "10:00",
      duration: 60,
      meetingType: "Consultation",
      timezone: "America/New_York",
    });
    expect(mockEmailsSend).toHaveBeenCalledWith({
      from: expect.stringContaining("Emmett Anthony"),
      to: "john@test.com",
      subject: "Reminder",
      html: "<p>Reminder</p>",
    });
    expect(mockAppointmentUpdate).toHaveBeenCalledWith({
      where: { id: "apt-1" },
      data: { reminderSent: true },
    });
    expect(mockAppointmentLogCreate).toHaveBeenCalledWith({
      data: {
        appointmentId: "apt-1",
        action: "REMINDER_SENT",
        detail: "24-hour reminder email sent",
      },
    });
  });

  it("handles email send failure gracefully", async () => {
    const { processAppointmentReminders } = await import("../cron/reminder-processor");
    mockAppointmentFindMany.mockResolvedValue([
      {
        id: "apt-2",
        name: "Jane",
        email: "jane@test.com",
        preferredDate: new Date(),
        preferredTime: "14:00",
        duration: 30,
        timezone: null,
        meetingType: null,
        status: "CONFIRMED",
        reminderSent: false,
      },
    ]);
    mockAppointmentReminderTemplate.mockReturnValue({ subject: "S", html: "<p>S</p>" });
    mockEmailsSend.mockRejectedValue(new Error("Send failed"));

    const result = await processAppointmentReminders();

    expect(result.remindersSent).toBe(0);
    expect(result.errors[0]).toContain("Failed to send appointment reminder for apt-2");
  });

  it("works without meetingType", async () => {
    const { processAppointmentReminders } = await import("../cron/reminder-processor");
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    mockAppointmentFindMany.mockResolvedValue([
      {
        id: "apt-3",
        name: "Bob",
        email: "bob@test.com",
        preferredDate: tomorrow,
        preferredTime: "09:00",
        duration: 45,
        timezone: null,
        meetingType: null,
        status: "CONFIRMED",
        reminderSent: false,
      },
    ]);
    mockAppointmentReminderTemplate.mockReturnValue({ subject: "S", html: "<p>S</p>" });
    mockEmailsSend.mockResolvedValue({});
    mockAppointmentUpdate.mockResolvedValue({});
    mockAppointmentLogCreate.mockResolvedValue({});

    const result = await processAppointmentReminders();

    expect(result.remindersSent).toBe(1);
    expect(mockAppointmentReminderTemplate).toHaveBeenCalledWith({
      name: "Bob",
      date: tomorrow,
      time: "09:00",
      duration: 45,
      meetingType: undefined,
      timezone: null,
    });
  });
});
