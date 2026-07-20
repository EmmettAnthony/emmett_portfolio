// ──────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/sse — Server-Sent Events stream
// ──────────────────────────────────────────────────────────────────────────────
// Streams new notification events to connected clients in real time.
// Clients connect via EventSource in the browser.
//
// Event format (SSE):
//   event: notification
//   data: { "notification": {...}, "eventKey": "...", "isUrgent": true/false }
//
// Also sends a heartbeat comment every 30s to keep the connection alive.
// Cleans up properly when the client disconnects via request.signal.
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest } from "next/server";
import { auth } from "@/../auth";
import { onNotification } from "@/lib/notifications/notification-bus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id as string;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: (() => void) | null = null;

  // Create a ReadableStream that emits SSE-formatted data
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      const connectedMsg = `event: connected\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`;
      controller.enqueue(new TextEncoder().encode(connectedMsg));

      // Subscribe to new notifications
      unsubscribe = onNotification((event) => {
        // Only send notifications intended for this user
        if (event.notification.userId !== null && event.notification.userId !== userId) {
          return;
        }

        try {
          const data = JSON.stringify({
            notification: event.notification,
            eventKey: event.eventKey,
            isUrgent: event.isUrgent,
          });
          controller.enqueue(new TextEncoder().encode(`event: notification\ndata: ${data}\n\n`));
        } catch {
          // Stream closed — unsubscribe will be called in cleanup
        }
      });

      // Heartbeat to keep connection alive (every 30s)
      heartbeat = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": heartbeat\n\n"));
        } catch {
          cleanup();
        }
      }, 30000);
    },
  });

  function cleanup() {
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  // Clean up when the client disconnects
  request.signal.addEventListener("abort", cleanup);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
