import { prisma } from "@/lib/db";

type TriggerEvent = "ticket_created" | "ticket_updated" | "ticket_closed" | "ticket_escalated";

export async function runAutomationRules(trigger: TriggerEvent, ticket: { id: string; subject: string; description: string; email: string; fullName: string; priorityId?: string | null; categoryId?: string | null; statusId?: string | null }) {
  const rules = await prisma.supportAutomationRule.findMany({
    where: { isEnabled: true, trigger },
    orderBy: { sortOrder: "asc" },
  });

  for (const rule of rules) {
    try {
      const conditions = rule.conditions as Array<{ field: string; operator: string; value: string }>;
      let matches = true;
      for (const c of conditions) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldValue = String((ticket as any)[c.field] || "");
        switch (c.operator) {
          case "equals": if (fieldValue !== c.value) matches = false; break;
          case "contains": if (!fieldValue.toLowerCase().includes(c.value.toLowerCase())) matches = false; break;
          default: matches = false;
        }
        if (!matches) break;
      }
      if (!matches) continue;

      const actions = rule.actions as Array<{ type: string; value: string }>;
      for (const a of actions) {
        switch (a.type) {
          case "assign_to":
            await prisma.supportTicket.update({ where: { id: ticket.id }, data: { assignedToId: a.value } });
            break;
          case "change_status":
            await prisma.supportTicket.update({ where: { id: ticket.id }, data: { statusId: a.value } });
            break;
          case "change_priority":
            await prisma.supportTicket.update({ where: { id: ticket.id }, data: { priorityId: a.value } });
            break;
          case "add_tag":
            const current = await prisma.supportTicket.findUnique({ where: { id: ticket.id }, select: { tags: true } });
            const tags = current?.tags ? JSON.parse(current.tags) : [];
            if (typeof tags === "string") tags.split(",");
            if (!tags.includes(a.value)) tags.push(a.value);
            await prisma.supportTicket.update({ where: { id: ticket.id }, data: { tags: JSON.stringify(tags) } });
            break;
          case "notify":
            const { sendNotification } = await import("@/lib/notifications/notification-service");
            await sendNotification({
              eventKey: `support.rule.${trigger}`,
              title: `Automation: ${rule.name}`,
              message: `Rule "${rule.name}" triggered on ticket ${ticket.subject}`,
              link: `/dashboard/support/tickets/${ticket.id}`,
              source: "support",
              categoryOverride: "SUPPORT" as const,
            });
            break;
        }
      }
    } catch (err) {
      console.error(`Automation rule "${rule.name}" failed:`, err);
    }
  }
}
