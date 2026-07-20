import { describe, it, expect } from "vitest";
import {
  createEventSchema,
  updateEventSchema,
  createAppointmentSchema,
  updateAppointmentSchema,
  publicBookingSchema,
  createTaskSchema,
  updateTaskSchema,
  createReminderSchema,
  updateReminderSchema,
  createAvailabilitySchema,
  updateAvailabilitySchema,
  createDateExceptionSchema,
  createMeetingTypeSchema,
  updateMeetingTypeSchema,
  createIntegrationSchema,
  analyticsQuerySchema,
} from "../validations/calendar";

describe("createEventSchema", () => {
  it("parses valid event", () => {
    const result = createEventSchema.parse({
      title: "Team Meeting",
      startDate: "2024-01-15",
      eventType: "MEETING",
    });
    expect(result.title).toBe("Team Meeting");
    expect(result.startDate).toBe("2024-01-15");
    expect(result.eventType).toBe("MEETING");
    expect(result.allDay).toBe(false);
    expect(result.color).toBe("#3b82f6");
    expect(result.status).toBe("SCHEDULED");
    expect(result.priority).toBe("MEDIUM");
  });

  it("rejects empty title", () => {
    const result = createEventSchema.safeParse({
      title: "",
      startDate: "2024-01-15",
      eventType: "MEETING",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty startDate", () => {
    const result = createEventSchema.safeParse({
      title: "Meeting",
      startDate: "",
      eventType: "MEETING",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid eventType", () => {
    const result = createEventSchema.safeParse({
      title: "Meeting",
      startDate: "2024-01-15",
      eventType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid hex color", () => {
    const result = createEventSchema.safeParse({
      title: "Meeting",
      startDate: "2024-01-15",
      eventType: "MEETING",
      color: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createEventSchema.safeParse({
      title: "Meeting",
      startDate: "2024-01-15",
      eventType: "MEETING",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = createEventSchema.safeParse({
      title: "Meeting",
      startDate: "2024-01-15",
      eventType: "MEETING",
      priority: "TOP",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = createEventSchema.parse({
      title: "Meeting",
      description: "Discuss project",
      startDate: "2024-01-15",
      endDate: "2024-01-15",
      startTime: "09:00",
      endTime: "10:00",
      allDay: true,
      location: "Room 1",
      link: "https://meet.example.com",
      color: "#ff0000",
      eventType: "CONSULTATION",
      status: "COMPLETED",
      priority: "HIGH",
      notes: "Bring laptop",
      attachments: "file.pdf",
      recurring: "weekly",
    });
    expect(result.link).toBe("https://meet.example.com");
    expect(result.color).toBe("#ff0000");
    expect(result.status).toBe("COMPLETED");
  });

  it("accepts empty string for link", () => {
    const result = createEventSchema.parse({
      title: "Meeting",
      startDate: "2024-01-15",
      eventType: "MEETING",
      link: "",
    });
    expect(result.link).toBe("");
  });

  it("rejects invalid url for link", () => {
    const result = createEventSchema.safeParse({
      title: "Meeting",
      startDate: "2024-01-15",
      eventType: "MEETING",
      link: "not-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateEventSchema", () => {
  it("parses empty object", () => {
    const result = updateEventSchema.parse({});
    expect(result).toEqual({
      allDay: false,
      color: "#3b82f6",
      priority: "MEDIUM",
      status: "SCHEDULED",
    });
  });
});

describe("createAppointmentSchema", () => {
  it("parses valid appointment", () => {
    const result = createAppointmentSchema.parse({
      name: "John Doe",
      email: "john@example.com",
      preferredDate: "2024-01-20",
    });
    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.preferredDate).toBe("2024-01-20");
    expect(result.duration).toBe(30);
    expect(result.status).toBe("PENDING");
    expect(result.source).toBe("WEBSITE");
  });

  it("rejects empty name", () => {
    const result = createAppointmentSchema.safeParse({
      name: "",
      email: "john@example.com",
      preferredDate: "2024-01-20",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createAppointmentSchema.safeParse({
      name: "John",
      email: "bad",
      preferredDate: "2024-01-20",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty preferredDate", () => {
    const result = createAppointmentSchema.safeParse({
      name: "John",
      email: "john@example.com",
      preferredDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createAppointmentSchema.safeParse({
      name: "John",
      email: "john@example.com",
      preferredDate: "2024-01-20",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid source", () => {
    const result = createAppointmentSchema.safeParse({
      name: "John",
      email: "john@example.com",
      preferredDate: "2024-01-20",
      source: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAppointmentSchema", () => {
  it("parses empty object", () => {
    const result = updateAppointmentSchema.parse({});
    expect(result).toEqual({
      duration: 30,
      source: "WEBSITE",
      status: "PENDING",
    });
  });
});

describe("publicBookingSchema", () => {
  it("parses valid booking", () => {
    const result = publicBookingSchema.parse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      preferredDate: "2024-01-20",
      preferredTime: "10:00",
      terms: true,
    });
    expect(result.firstName).toBe("John");
    expect(result.lastName).toBe("Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.terms).toBe(true);
    expect(result.duration).toBe(30);
    expect(result.newsletter).toBe(false);
  });

  it("rejects empty firstName", () => {
    const result = publicBookingSchema.safeParse({
      firstName: "",
      lastName: "Doe",
      email: "john@example.com",
      preferredDate: "2024-01-20",
      preferredTime: "10:00",
      terms: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = publicBookingSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "bad",
      preferredDate: "2024-01-20",
      preferredTime: "10:00",
      terms: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing preferredTime", () => {
    const result = publicBookingSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      preferredDate: "2024-01-20",
      preferredTime: "",
      terms: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects false terms", () => {
    const result = publicBookingSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      preferredDate: "2024-01-20",
      preferredTime: "10:00",
      terms: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing terms", () => {
    const result = publicBookingSchema.safeParse({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      preferredDate: "2024-01-20",
      preferredTime: "10:00",
    });
    expect(result.success).toBe(false);
  });
});

describe("createTaskSchema", () => {
  it("parses valid task", () => {
    const result = createTaskSchema.parse({
      title: "Complete report",
    });
    expect(result.title).toBe("Complete report");
    expect(result.priority).toBe("MEDIUM");
    expect(result.status).toBe("PENDING");
    expect(result.progress).toBe(0);
    expect(result.order).toBe(0);
    expect(result.color).toBe("#8b5cf6");
  });

  it("rejects empty title", () => {
    const result = createTaskSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid priority", () => {
    const result = createTaskSchema.safeParse({
      title: "Task",
      priority: "TOP",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createTaskSchema.safeParse({
      title: "Task",
      status: "DONE",
    });
    expect(result.success).toBe(false);
  });

  it("rejects progress below 0", () => {
    const result = createTaskSchema.safeParse({
      title: "Task",
      progress: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects progress above 100", () => {
    const result = createTaskSchema.safeParse({
      title: "Task",
      progress: 101,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("parses empty object", () => {
    const result = updateTaskSchema.parse({});
    expect(result).toEqual({
      color: "#8b5cf6",
      order: 0,
      priority: "MEDIUM",
      progress: 0,
      status: "PENDING",
    });
  });
});

describe("createReminderSchema", () => {
  it("parses valid reminder", () => {
    const result = createReminderSchema.parse({
      title: "Meeting reminder",
      remindAt: "2024-01-15T09:00:00Z",
    });
    expect(result.title).toBe("Meeting reminder");
    expect(result.remindAt).toBe("2024-01-15T09:00:00Z");
    expect(result.remindType).toBe("DASHBOARD");
    expect(result.status).toBe("PENDING");
  });

  it("rejects empty title", () => {
    const result = createReminderSchema.safeParse({
      title: "",
      remindAt: "2024-01-15T09:00:00Z",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty remindAt", () => {
    const result = createReminderSchema.safeParse({
      title: "Reminder",
      remindAt: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid remindType", () => {
    const result = createReminderSchema.safeParse({
      title: "Reminder",
      remindAt: "2024-01-15T09:00:00Z",
      remindType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid status", () => {
    const result = createReminderSchema.safeParse({
      title: "Reminder",
      remindAt: "2024-01-15T09:00:00Z",
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateReminderSchema", () => {
  it("parses empty object", () => {
    const result = updateReminderSchema.parse({});
    expect(result).toEqual({
      remindType: "DASHBOARD",
      status: "PENDING",
    });
  });
});

describe("createAvailabilitySchema", () => {
  it("parses valid availability", () => {
    const result = createAvailabilitySchema.parse({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.dayOfWeek).toBe(1);
    expect(result.startTime).toBe("09:00");
    expect(result.endTime).toBe("17:00");
    expect(result.isActive).toBe(true);
    expect(result.slotDuration).toBe(30);
  });

  it("rejects dayOfWeek below 0", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: -1,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects dayOfWeek above 6", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: 7,
      startTime: "09:00",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid time format", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "9 AM",
      endTime: "17:00",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slotDuration below 15", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects slotDuration above 240", () => {
    const result = createAvailabilitySchema.safeParse({
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 300,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateAvailabilitySchema", () => {
  it("parses empty object", () => {
    const result = updateAvailabilitySchema.parse({});
    expect(result).toEqual({
      isActive: true,
      slotDuration: 30,
    });
  });
});

describe("createDateExceptionSchema", () => {
  it("parses valid exception", () => {
    const result = createDateExceptionSchema.parse({
      date: "2024-12-25",
      type: "HOLIDAY",
    });
    expect(result.date).toBe("2024-12-25");
    expect(result.type).toBe("HOLIDAY");
    expect(result.isAvailable).toBe(false);
  });

  it("rejects empty date", () => {
    const result = createDateExceptionSchema.safeParse({
      date: "",
      type: "HOLIDAY",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type", () => {
    const result = createDateExceptionSchema.safeParse({
      date: "2024-12-25",
      type: "INVALID",
    });
    expect(result.success).toBe(false);
  });
});

describe("createMeetingTypeSchema", () => {
  it("parses valid meeting type", () => {
    const result = createMeetingTypeSchema.parse({
      name: "Consultation",
      slug: "consultation",
      duration: 30,
    });
    expect(result.name).toBe("Consultation");
    expect(result.slug).toBe("consultation");
    expect(result.duration).toBe(30);
    expect(result.color).toBe("#3b82f6");
    expect(result.isActive).toBe(true);
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = createMeetingTypeSchema.safeParse({
      name: "",
      slug: "consultation",
      duration: 30,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = createMeetingTypeSchema.safeParse({
      name: "Consultation",
      slug: "INVALID SLUG",
      duration: 30,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration below 15", () => {
    const result = createMeetingTypeSchema.safeParse({
      name: "Consultation",
      slug: "consultation",
      duration: 10,
    });
    expect(result.success).toBe(false);
  });

  it("rejects duration above 480", () => {
    const result = createMeetingTypeSchema.safeParse({
      name: "Consultation",
      slug: "consultation",
      duration: 500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive price", () => {
    const result = createMeetingTypeSchema.safeParse({
      name: "Consultation",
      slug: "consultation",
      duration: 30,
      price: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateMeetingTypeSchema", () => {
  it("parses empty object", () => {
    const result = updateMeetingTypeSchema.parse({});
    expect(result).toEqual({
      color: "#3b82f6",
      isActive: true,
      order: 0,
    });
  });
});

describe("createIntegrationSchema", () => {
  it("parses valid integration", () => {
    const result = createIntegrationSchema.parse({
      provider: "GOOGLE",
    });
    expect(result.provider).toBe("GOOGLE");
    expect(result.syncEnabled).toBe(true);
    expect(result.syncDirection).toBe("BOTH");
  });

  it("rejects invalid provider", () => {
    const result = createIntegrationSchema.safeParse({
      provider: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid syncDirection", () => {
    const result = createIntegrationSchema.safeParse({
      provider: "GOOGLE",
      syncDirection: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createIntegrationSchema.safeParse({
      provider: "GOOGLE",
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all optional fields", () => {
    const result = createIntegrationSchema.parse({
      provider: "OUTLOOK",
      email: "user@outlook.com",
      accessToken: "token",
      refreshToken: "refresh",
      tokenExpiry: "2024-12-31",
      calendarId: "cal_1",
      calendarName: "Work",
      syncEnabled: false,
      syncDirection: "IMPORT",
    });
    expect(result.email).toBe("user@outlook.com");
    expect(result.syncDirection).toBe("IMPORT");
  });
});

describe("analyticsQuerySchema", () => {
  it("parses empty object", () => {
    const result = analyticsQuerySchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields", () => {
    const result = analyticsQuerySchema.parse({
      startDate: "2024-01-01",
      endDate: "2024-12-31",
    });
    expect(result.startDate).toBe("2024-01-01");
    expect(result.endDate).toBe("2024-12-31");
  });
});
