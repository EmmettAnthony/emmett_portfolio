// ──────────────────────────────────────────────────────────────────────────────
// NotificationBus — In-memory pub/sub for real-time notification events
// ──────────────────────────────────────────────────────────────────────────────
// Used by:
//   - notification-service.ts  → emits events when notifications are created
//   - /api/notifications/sse    → subscribes and streams to connected clients
// ──────────────────────────────────────────────────────────────────────────────

import { EventEmitter } from "events";
import type { NotificationData } from "@/types/notifications";

// ─── Event Types ────────────────────────────────────────────────────────────

export interface NotificationBusEvent {
  /** The full notification object */
  notification: NotificationData;
  /** Event key that triggered this notification */
  eventKey: string;
  /** Whether this is a high-priority notification (for sound/desktop decisions) */
  isUrgent: boolean;
}

export type NotificationBusListener = (event: NotificationBusEvent) => void;

// ─── Singleton Bus ──────────────────────────────────────────────────────────

const bus = new EventEmitter();
bus.setMaxListeners(100); // Allow many SSE connections

const EVENT_NAME = "notification";

// ─── Public API ─────────────────────────────────────────────────────────────

export function emitNotification(event: NotificationBusEvent): void {
  bus.emit(EVENT_NAME, event);
}

export function onNotification(listener: NotificationBusListener): () => void {
  bus.on(EVENT_NAME, listener);
  // Return an unsubscribe function
  return () => {
    bus.off(EVENT_NAME, listener);
  };
}

export function offNotification(listener: NotificationBusListener): void {
  bus.off(EVENT_NAME, listener);
}
