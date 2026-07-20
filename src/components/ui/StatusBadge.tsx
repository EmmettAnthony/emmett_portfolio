import { cn } from "@/lib/utils";

/**
 * Maps a status string to the appropriate design system badge tokens.
 *
 * The tokens resolve to theme-aware colors via CSS custom properties:
 *   bg-badge-success-bg / text-badge-success-text  (green)
 *   bg-badge-warning-bg / text-badge-warning-text  (amber)
 *   bg-badge-error-bg   / text-badge-error-text    (red)
 *   bg-badge-info-bg    / text-badge-info-text     (blue)
 *   bg-badge-neutral-bg / text-badge-neutral-text  (gray)
 */
const statusColorMap: Record<string, string> = {
  /* ── Success (green) ─────────────────────────── */
  ACTIVE: "bg-badge-success-bg text-badge-success-text",
  PUBLISHED: "bg-badge-success-bg text-badge-success-text",
  COMPLETED: "bg-badge-success-bg text-badge-success-text",
  SENT: "bg-badge-success-bg text-badge-success-text",
  APPROVED: "bg-badge-success-bg text-badge-success-text",
  WON: "bg-badge-success-bg text-badge-success-text",
  CONVERTED: "bg-badge-success-bg text-badge-success-text",
  DELIVERED: "bg-badge-success-bg text-badge-success-text",
  VERIFIED: "bg-badge-success-bg text-badge-success-text",
  SUBSCRIBED: "bg-badge-success-bg text-badge-success-text",

  /* ── Warning (amber) ────────────────────────── */
  PENDING: "bg-badge-warning-bg text-badge-warning-text",
  IN_PROGRESS: "bg-badge-warning-bg text-badge-warning-text",
  REVIEW: "bg-badge-warning-bg text-badge-warning-text",
  SENDING: "bg-badge-warning-bg text-badge-warning-text",
  CONTACTED: "bg-badge-warning-bg text-badge-warning-text",
  QUALIFIED: "bg-badge-warning-bg text-badge-warning-text",
  PROPOSAL_SENT: "bg-badge-warning-bg text-badge-warning-text",
  NEGOTIATION: "bg-badge-warning-bg text-badge-warning-text",
  SCHEDULED: "bg-badge-warning-bg text-badge-warning-text",
  PAUSED: "bg-badge-warning-bg text-badge-warning-text",
  DRAFT: "bg-badge-warning-bg text-badge-warning-text",
  RESCHEDULED: "bg-badge-warning-bg text-badge-warning-text",
  LIMITED: "bg-badge-warning-bg text-badge-warning-text",

  /* ── Error (red) ────────────────────────────── */
  ERROR: "bg-badge-error-bg text-badge-error-text",
  FAILED: "bg-badge-error-bg text-badge-error-text",
  CANCELLED: "bg-badge-error-bg text-badge-error-text",
  BOUNCED: "bg-badge-error-bg text-badge-error-text",
  UNSUBSCRIBED: "bg-badge-error-bg text-badge-error-text",
  COMPLAINED: "bg-badge-error-bg text-badge-error-text",
  LOST: "bg-badge-error-bg text-badge-error-text",
  EXPIRED: "bg-badge-error-bg text-badge-error-text",
  CLOSED: "bg-badge-error-bg text-badge-error-text",
  REJECTED: "bg-badge-error-bg text-badge-error-text",

  /* ── Info (blue) ────────────────────────────── */
  INFO: "bg-badge-info-bg text-badge-info-text",
  NEW: "bg-badge-info-bg text-badge-info-text",
  PENDING_VERIFICATION: "bg-badge-info-bg text-badge-info-text",
  AWAITING_WINNER: "bg-badge-info-bg text-badge-info-text",
  CONFIRMED: "bg-badge-info-bg text-badge-info-text",
  LEAD: "bg-badge-info-bg text-badge-info-text",
  MEETING: "bg-badge-info-bg text-badge-info-text",
};

export interface StatusBadgeProps {
  /** The status value — automatically mapped to the correct color scheme */
  status: string;
  /** Optional override label (defaults to a formatted version of the status) */
  label?: string;
  /** Show a colored dot indicator before the label */
  showDot?: boolean;
  /** Additional classes to merge */
  className?: string;
}

/**
 * Formats a status string into a human-readable label.
 *
 * Examples:
 *   "PENDING_VERIFICATION"  → "Pending verification"
 *   "IN_PROGRESS"           → "In progress"
 *   "ACTIVE"                → "Active"
 */
function formatLabel(status: string): string {
  if (status === "PENDING_VERIFICATION") return "Pending verification";
  if (status === "PROPOSAL_SENT") return "Proposal sent";
  if (status === "AWAITING_WINNER") return "Awaiting winner";

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^(.)/, (c) => c.toUpperCase());
}

/**
 * A status badge that automatically maps status values to the correct
 * design system badge tokens (bg-badge-* / text-badge-*).
 *
 * Usage:
 *   <StatusBadge status="ACTIVE" />
 *   <StatusBadge status="PENDING" label="In Review" showDot />
 *   <StatusBadge status="CANCELLED" className="text-xs" />
 */
export function StatusBadge({
  status,
  label,
  showDot = false,
  className,
}: StatusBadgeProps) {
  const colorClass =
    statusColorMap[status] ?? "bg-badge-neutral-bg text-badge-neutral-text";

  const displayLabel = label ?? formatLabel(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className,
      )}
    >
      {showDot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current opacity-70"
          aria-hidden="true"
        />
      )}
      {displayLabel}
    </span>
  );
}
