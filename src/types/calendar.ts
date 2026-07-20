export type EventType =
  | "MEETING"
  | "CONSULTATION"
  | "PROJECT_DEADLINE"
  | "PERSONAL"
  | "TASK"
  | "REMINDER";

export type EventStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "RESCHEDULED"
  | "NO_SHOW";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type ReminderType = "EMAIL" | "DASHBOARD" | "BOTH";

export type ReminderStatus = "PENDING" | "SENT" | "DISMISSED";

export type AppointmentSource = "WEBSITE" | "DASHBOARD" | "REFERRAL" | "OTHER";

export type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek" | "multiMonthYear";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  allDay: boolean;
  location?: string | null;
  link?: string | null;
  color: string;
  eventType: EventType;
  status: EventStatus;
  priority: Priority;
  notes?: string | null;
  attachments?: string | null;
  recurring?: string | null;
  recurrenceId?: string | null;
  appointmentId?: string | null;
  meetingTypeId?: string | null;
  taskId?: string | null;
  reminderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  projectType?: string | null;
  preferredDate: string;
  preferredTime?: string | null;
  duration: number;
  message?: string | null;
  notes?: string | null;
  status: AppointmentStatus;
  source: AppointmentSource;
  timezone?: string | null;
  meetingTypeId?: string | null;
  meetingType?: MeetingType | null;
  contactId?: string | null;
  projectId?: string | null;
  clientId?: string | null;
  cancellationReason?: string | null;
  rescheduleCount: number;
  reminderSent: boolean;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  completedAt?: string | null;
  appointmentLogs?: AppointmentLog[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  duration: number;
  color: string;
  icon?: string | null;
  location?: string | null;
  link?: string | null;
  price?: number | null;
  isActive: boolean;
  order: number;
}

export interface CalendarTask {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: Priority;
  status: TaskStatus;
  progress: number;
  category?: string | null;
  tags?: string | null;
  order: number;
  color: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string | null;
  remindAt: string;
  remindType: ReminderType;
  status: ReminderStatus;
  sentAt?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  repeatInterval?: string | null;
  repeatUntil?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  id: string;
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  slotDuration: number;
}

export interface DateException {
  id: string;
  date: string;
  type: "HOLIDAY" | "VACATION" | "BLOCKED" | "SPECIAL_HOURS";
  title?: string | null;
  isAvailable: boolean;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
}

export interface CalendarIntegration {
  id: string;
  provider: "GOOGLE" | "OUTLOOK" | "APPLE";
  email?: string | null;
  calendarName?: string | null;
  syncEnabled: boolean;
  lastSyncedAt?: string | null;
  syncDirection: "IMPORT" | "EXPORT" | "BOTH";
}

export interface AppointmentLog {
  id: string;
  appointmentId: string;
  action: string;
  detail?: string | null;
  createdAt: string;
}

export interface CalendarAnalytics {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  totalConsultations: number;
  bookingConversionRate: number;
  mostPopularTimeSlot: string;
  mostPopularDay: string;
  completionRate: number;
  appointmentsByType: { type: string; count: number }[];
  appointmentsByMonth: { month: string; count: number }[];
  upcomingAppointments: number;
  overdueTasks: number;
  pendingReminders: number;
}

// FullCalendar event format
export interface CalendarEventInput {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: Record<string, unknown>;
}
