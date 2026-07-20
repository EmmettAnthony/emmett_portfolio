export function calculateNextRun(campaign: {
  recurringFrequency: string | null;
  recurringDayOfWeek: number | null;
  recurringDayOfMonth: number | null;
}): Date | null {
  const freq = campaign.recurringFrequency;
  if (!freq) return null;

  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  switch (freq) {
    case "daily": {
      const next = new Date(today);
      next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }
    case "weekly": {
      const dayOfWeek = campaign.recurringDayOfWeek;
      if (dayOfWeek === null || dayOfWeek === undefined) return null;
      const currentDay = today.getUTCDay();
      let diff = dayOfWeek - currentDay;
      if (diff <= 0) diff += 7;
      const next = new Date(today);
      next.setUTCDate(next.getUTCDate() + diff);
      return next;
    }
    case "monthly": {
      const dayOfMonth = campaign.recurringDayOfMonth;
      if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) return null;
      let next = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), dayOfMonth));
      if (next <= today) {
        next = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, dayOfMonth));
      }
      return next;
    }
    default:
      return null;
  }
}
