import { describe, it, expect } from "vitest";
import { computeTrend, buildOverviewResult } from "@/lib/overview";

// ─── computeTrend ────────────────────────────────────────────────────────────

describe("computeTrend", () => {
  it("returns null when both values are 0", () => {
    expect(computeTrend(0, 0)).toBeNull();
  });

  it("returns +100% when previous is 0 and current is positive", () => {
    expect(computeTrend(5, 0)).toEqual({ value: 100, positive: true });
    expect(computeTrend(1, 0)).toEqual({ value: 100, positive: true });
  });

  it("returns -100% when current is 0 and previous is positive", () => {
    expect(computeTrend(0, 5)).toEqual({ value: 100, positive: false });
    expect(computeTrend(0, 1)).toEqual({ value: 100, positive: false });
  });

  it("computes positive percentage increase correctly", () => {
    expect(computeTrend(10, 5)).toEqual({ value: 100, positive: true });
    expect(computeTrend(15, 10)).toEqual({ value: 50, positive: true });
    expect(computeTrend(200, 100)).toEqual({ value: 100, positive: true });
  });

  it("computes negative percentage decrease correctly", () => {
    expect(computeTrend(5, 10)).toEqual({ value: 50, positive: false });
    expect(computeTrend(10, 15)).toEqual({ value: 33, positive: false });
    expect(computeTrend(1, 100)).toEqual({ value: 99, positive: false });
  });

  it("returns 0% change when values are equal and non-zero", () => {
    expect(computeTrend(5, 5)).toEqual({ value: 0, positive: true });
    expect(computeTrend(100, 100)).toEqual({ value: 0, positive: true });
  });

  it("rounds to nearest integer percentage", () => {
    // 1/3 ≈ 33.33% → rounds to 33
    expect(computeTrend(4, 3)).toEqual({ value: 33, positive: true });
    // 2/3 ≈ 66.67% → rounds to 67
    expect(computeTrend(5, 3)).toEqual({ value: 67, positive: true });
    // -1/3 ≈ -33.33% → rounds to 33
    expect(computeTrend(2, 3)).toEqual({ value: 33, positive: false });
  });

  it("handles large numbers", () => {
    expect(computeTrend(1000, 1)).toEqual({ value: 99900, positive: true });
    expect(computeTrend(1, 1000)).toEqual({ value: 100, positive: false });
  });
});

// ─── buildOverviewResult ─────────────────────────────────────────────────────

describe("buildOverviewResult", () => {
  const baseInputs = {
    totalLeads: 100,
    contacts: [
      { status: "NEW" },
      { status: "NEW" },
      { status: "WON" },
      { status: "WON" },
      { status: "LOST" },
    ],
    activeProjects: 5,
    blogPosts: 12,
    newsletterSubscribers: 45,
    sentCampaigns: 3,
    totalSentEvents: 500,
    totalOpens: 100,
    totalClicks: 25,
    campaignPerformance: [
      { id: "1", name: "Newsletter #1", sent: 200, opens: 50, clicks: 10, openRate: 25, clickRate: 5 },
    ],
    todayEventCount: 3,
    upcomingApptCount: 7,
    overdueTasks: 2,
    lastWeekTodayEventCount: 1,
    appointmentsCreatedThisWeek: 4,
    appointmentsCreatedPrevWeek: 2,
    tasksOverdueThisWeek: 3,
    tasksOverduePrevWeek: 5,
  };

  it("computes newLeads and wonLeads from contacts", () => {
    const result = buildOverviewResult(baseInputs);
    expect(result.newLeads).toBe(2);
    expect(result.conversionRate).toBe(2); // (2 won / 100 total) * 100 = 2%
  });

  it("passes through scalar stats correctly", () => {
    const result = buildOverviewResult(baseInputs);
    expect(result.totalLeads).toBe(100);
    expect(result.activeProjects).toBe(5);
    expect(result.blogPosts).toBe(12);
    expect(result.newsletterSubscribers).toBe(45);
    expect(result.sentCampaigns).toBe(3);
  });

  it("computes open and click rates correctly", () => {
    const result = buildOverviewResult(baseInputs);
    // totalSentEvents=500, totalOpens=100 → 20%
    expect(result.overallOpenRate).toBe(20);
    // totalSentEvents=500, totalClicks=25 → 5%
    expect(result.overallClickRate).toBe(5);
  });

  it("returns 0% rates when there are no sent events", () => {
    const result = buildOverviewResult({ ...baseInputs, totalSentEvents: 0, totalOpens: 0, totalClicks: 0 });
    expect(result.overallOpenRate).toBe(0);
    expect(result.overallClickRate).toBe(0);
  });

  it("passes through calendar KPIs", () => {
    const result = buildOverviewResult(baseInputs);
    expect(result.todayEventCount).toBe(3);
    expect(result.upcomingApptCount).toBe(7);
    expect(result.overdueTaskCount).toBe(2);
  });

  it("computes trends from the week-over-week values", () => {
    const result = buildOverviewResult(baseInputs);
    // todayEventCount=3, lastWeek=1 → +200%
    expect(result.todayEventsTrend).toEqual({ value: 200, positive: true });
    // appointmentsThisWeek=4, previousWeek=2 → +100%
    expect(result.appointmentsTrend).toEqual({ value: 100, positive: true });
    // tasksThisWeek=3, previousWeek=5 → -40%
    expect(result.overdueTasksTrend).toEqual({ value: 40, positive: false });
  });

  it("passes through campaign performance", () => {
    const result = buildOverviewResult(baseInputs);
    expect(result.campaignPerformance).toHaveLength(1);
    expect(result.campaignPerformance[0].id).toBe("1");
    expect(result.campaignPerformance[0].name).toBe("Newsletter #1");
  });

  it("returns 0 conversionRate when there are no leads", () => {
    const result = buildOverviewResult({
      ...baseInputs,
      totalLeads: 0,
      contacts: [],
    });
    expect(result.conversionRate).toBe(0);
  });

  it("returns null trend when both current and previous are 0", () => {
    const result = buildOverviewResult({
      ...baseInputs,
      todayEventCount: 0,
      lastWeekTodayEventCount: 0,
    });
    expect(result.todayEventsTrend).toBeNull();
  });
});
