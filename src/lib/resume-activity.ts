import { auth } from "@/../auth";
import { logActivity } from "@/lib/activity";

export async function logResumeActivity(
  action: string,
  entity: string,
  detail?: string,
  entityId?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    await logActivity({
      action,
      module: "resume",
      entity,
      entityId,
      description: detail || `${action} ${entity}`,
      userId: session.user.id,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
