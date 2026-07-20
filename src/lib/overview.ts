/**
 * Compute a week-over-week percentage change trend indicator.
 *
 * Returns `null` when both values are 0 (no trend to show).
 * Returns +100% when previous is 0 but current is >0 (emerging from nothing).
 * Otherwise returns the rounded percentage change with a positive/negative flag.
 *
 * @example
 * computeTrend(10, 5)  // { value: 100, positive: true }  — 100% increase
 * computeTrend(5, 10)  // { value: 50, positive: false }  — 50% decrease
 * computeTrend(0, 0)   // null
 */
export function computeTrend(
  current: number,
  previous: number
): { value: number; positive: boolean } | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return { value: 100, positive: true };
  const change = Math.round(((current - previous) / previous) * 100);
  return { value: Math.abs(change), positive: change >= 0 };
}

export interface CampaignPerformanceItem {
  id: string;
  name: string;
  sent: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
}

export interface OverviewResult {
  totalLeads: number;
  newLeads: number;
  conversionRate: number;
  activeProjects: number;
  blogPosts: number;
  newsletterSubscribers: number;
  sentCampaigns: number;
  overallOpenRate: number;
  overallClickRate: number;
  campaignPerformance: CampaignPerformanceItem[];
  activeSubscribers: number;
  todayEventCount: number;
  upcomingApptCount: number;
  overdueTaskCount: number;
  todayEventsTrend: { value: number; positive: boolean } | null;
  appointmentsTrend: { value: number; positive: boolean } | null;
  overdueTasksTrend: { value: number; positive: boolean } | null;
}

/**
 * Build the final overview result from raw Prisma query outputs.
 * Extracted for testability — the route handler delegates to this.
 */
export function buildOverviewResult(inputs: {
  totalLeads: number;
  contacts: { status: string }[];
  activeProjects: number;
  blogPosts: number;
  newsletterSubscribers: number;
  sentCampaigns: number;
  totalSentEvents: number;
  totalOpens: number;
  totalClicks: number;
  campaignPerformance: CampaignPerformanceItem[];
  todayEventCount: number;
  upcomingApptCount: number;
  overdueTasks: number;
  lastWeekTodayEventCount: number;
  appointmentsCreatedThisWeek: number;
  appointmentsCreatedPrevWeek: number;
  tasksOverdueThisWeek: number;
  tasksOverduePrevWeek: number;
}): OverviewResult {
  const newLeads = inputs.contacts.filter((c) => c.status === "NEW").length;
  const wonLeads = inputs.contacts.filter((c) => c.status === "WON").length;
  const totalLeads = inputs.totalLeads;

  return {
    totalLeads,
    newLeads,
    conversionRate: totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0,
    activeProjects: inputs.activeProjects,
    blogPosts: inputs.blogPosts,
    newsletterSubscribers: inputs.newsletterSubscribers,
    sentCampaigns: inputs.sentCampaigns,
    overallOpenRate:
      inputs.totalSentEvents > 0
        ? Math.round((inputs.totalOpens / inputs.totalSentEvents) * 10000) / 100
        : 0,
    overallClickRate:
      inputs.totalSentEvents > 0
        ? Math.round((inputs.totalClicks / inputs.totalSentEvents) * 10000) / 100
        : 0,
    campaignPerformance: inputs.campaignPerformance,
    activeSubscribers: inputs.newsletterSubscribers,
    todayEventCount: inputs.todayEventCount,
    upcomingApptCount: inputs.upcomingApptCount,
    overdueTaskCount: inputs.overdueTasks,
    todayEventsTrend: computeTrend(inputs.todayEventCount, inputs.lastWeekTodayEventCount),
    appointmentsTrend: computeTrend(inputs.appointmentsCreatedThisWeek, inputs.appointmentsCreatedPrevWeek),
    overdueTasksTrend: computeTrend(inputs.tasksOverdueThisWeek, inputs.tasksOverduePrevWeek),
  };
}
