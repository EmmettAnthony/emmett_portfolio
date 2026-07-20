// ──────────────────────────────────────────────────────────────────────────────
// useNotificationSound
// ──────────────────────────────────────────────────────────────────────────────
// Plays an optional sound effect when new unread notifications arrive.
// Respects the user's soundEnabled preference.
// ──────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";

interface SoundNotification {
  id: string;
  priority: string;
}

/**
 * Creates a notification sound audio context and plays it when new
 * notifications arrive. Uses Web Audio API to generate a simple chime
 * — no external audio files required.
 */
export function useNotificationSound(
  notifications: SoundNotification[],
  soundEnabled: boolean
) {
  const seenIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!soundEnabled) return;
    if (notifications.length === 0) return;

    // Find newly arrived notifications
    const newNotifs = notifications.filter((n) => !seenIds.current.has(n.id));

    if (newNotifs.length === 0) return;

    // Mark them as seen
    for (const n of newNotifs) {
      seenIds.current.add(n.id);
    }

    // Determine sound type based on highest priority in new batch
    const hasCritical = newNotifs.some((n) => n.priority === "CRITICAL");
    const hasHigh = newNotifs.some((n) => n.priority === "HIGH");

    // Play the appropriate sound
    const playSound = async () => {
      try {
        if (!audioCtxRef.current) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic query type
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioCtxRef.current;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (hasCritical) {
          // Urgent: two-tone alert
          oscillator.type = "sawtooth";
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.15);
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.4);
        } else if (hasHigh) {
          // Medium priority: single beep
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(660, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.25);
        } else {
          // Low priority: soft chime
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(523, ctx.currentTime); // C5
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.15);
        }
      } catch {
        // Audio may fail in some environments - silently ignore
      }
    };

    playSound();
  }, [notifications, soundEnabled]);
}
