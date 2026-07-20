import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  // ── Success (green) ──
  it("renders ACTIVE with correct styling", () => {
    render(<StatusBadge status="ACTIVE" />);
    const badge = screen.getByText("Active");
    expect(badge.className).toContain("bg-badge-success-bg");
    expect(badge.className).toContain("text-badge-success-text");
  });

  it("renders PUBLISHED status", () => {
    render(<StatusBadge status="PUBLISHED" />);
    expect(screen.getByText("Published")).toBeInTheDocument();
  });

  it("renders COMPLETED status", () => {
    render(<StatusBadge status="COMPLETED" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  // ── Warning (amber) ──
  it("renders PENDING with correct styling", () => {
    render(<StatusBadge status="PENDING" />);
    const badge = screen.getByText("Pending");
    expect(badge.className).toContain("bg-badge-warning-bg");
    expect(badge.className).toContain("text-badge-warning-text");
  });

  it("renders IN_PROGRESS as 'In progress'", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("renders DRAFT status", () => {
    render(<StatusBadge status="DRAFT" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  // ── Error (red) ──
  it("renders ERROR with correct styling", () => {
    render(<StatusBadge status="ERROR" />);
    const badge = screen.getByText("Error");
    expect(badge.className).toContain("bg-badge-error-bg");
    expect(badge.className).toContain("text-badge-error-text");
  });

  it("renders FAILED status", () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders REJECTED status", () => {
    render(<StatusBadge status="REJECTED" />);
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  // ── Info (blue) ──
  it("renders NEW with correct styling", () => {
    render(<StatusBadge status="NEW" />);
    const badge = screen.getByText("New");
    expect(badge.className).toContain("bg-badge-info-bg");
    expect(badge.className).toContain("text-badge-info-text");
  });

  it("renders LEAD status", () => {
    render(<StatusBadge status="LEAD" />);
    expect(screen.getByText("Lead")).toBeInTheDocument();
  });

  // ── Unknown status ──
  it("renders unknown status with neutral styling", () => {
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    const badge = screen.getByText("Unknown status");
    expect(badge.className).toContain("bg-badge-neutral-bg");
    expect(badge.className).toContain("text-badge-neutral-text");
  });

  // ── Special formatting ──
  it("renders PENDING_VERIFICATION as 'Pending verification'", () => {
    render(<StatusBadge status="PENDING_VERIFICATION" />);
    expect(screen.getByText("Pending verification")).toBeInTheDocument();
  });

  it("renders PROPOSAL_SENT as 'Proposal sent'", () => {
    render(<StatusBadge status="PROPOSAL_SENT" />);
    expect(screen.getByText("Proposal sent")).toBeInTheDocument();
  });

  it("renders AWAITING_WINNER as 'Awaiting winner'", () => {
    render(<StatusBadge status="AWAITING_WINNER" />);
    expect(screen.getByText("Awaiting winner")).toBeInTheDocument();
  });

  // ── Label override ──
  it("uses custom label when provided", () => {
    render(<StatusBadge status="ACTIVE" label="Custom Label" />);
    expect(screen.getByText("Custom Label")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  // ── Dot indicator ──
  it("shows dot indicator when showDot is true", () => {
    const { container } = render(<StatusBadge status="ACTIVE" showDot />);
    const dot = container.querySelector("span[aria-hidden='true']");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("h-1.5", "w-1.5", "rounded-full");
  });

  it("does not show dot indicator by default", () => {
    const { container } = render(<StatusBadge status="ACTIVE" />);
    expect(container.querySelector("span[aria-hidden='true']")).not.toBeInTheDocument();
  });

  // ── Custom className ──
  it("merges custom className", () => {
    render(<StatusBadge status="ACTIVE" className="text-xs" />);
    const badge = screen.getByText("Active");
    expect(badge.className).toContain("text-xs");
  });

  // ── Rounded and inline styles ──
  it("has rounded-full and inline-flex by default", () => {
    render(<StatusBadge status="ACTIVE" />);
    const badge = screen.getByText("Active");
    expect(badge.className).toContain("rounded-full");
    expect(badge.className).toContain("inline-flex");
  });
});
