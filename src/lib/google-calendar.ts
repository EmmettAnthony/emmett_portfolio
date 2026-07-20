import { google } from "googleapis";

export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  startDate: string;
  startTime?: string;
  duration?: number;
  timezone?: string;
  attendeeEmail?: string;
}) {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    console.log("[Google Calendar] No service account configured. Skipping event creation.");
    console.log("[Google Calendar] Would create:", params.summary, params.startDate, params.startTime);
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(key),
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const startDateTime = params.startTime
      ? `${params.startDate}T${params.startTime}:00`
      : `${params.startDate}T09:00:00`;

    const duration = params.duration ?? 60;
    const startDateObj = new Date(startDateTime);
    const endDateObj = new Date(startDateObj.getTime() + duration * 60000);
    const endDateTime = endDateObj.toISOString().slice(0, 19);

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: params.summary,
        description: params.description,
        start: {
          dateTime: startDateTime,
          timeZone: params.timezone || "Africa/Monrovia",
        },
        end: {
          dateTime: endDateTime,
          timeZone: params.timezone || "Africa/Monrovia",
        },
        ...(params.attendeeEmail ? {
          attendees: [{ email: params.attendeeEmail }],
        } : {}),
      },
    });

    return event.data;
  } catch (error) {
    console.error("[Google Calendar] Failed to create event:", error);
    return null;
  }
}
