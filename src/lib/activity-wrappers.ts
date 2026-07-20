import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/../auth";
import { logActivity } from "@/lib/activity";
import { getCountryFromRequest } from "@/lib/geo";

// ─── Parse request metadata ─────────────────────────────────────────────
function getRequestMeta(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || undefined;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined;

  // Extract country from Vercel edge headers via @vercel/functions
  const country = getCountryFromRequest(request);

  return { userAgent, ip, country };
}

// ─── Auto-logging route handler wrapper ─────────────────────────────────
// Wraps an API route handler to auto-log the action.
// Usage: export const GET = withActivityLog("view", "module", "description")(async (req) => { ... })

export function withActivityLog(
  action: string,
  module: string,
  descriptionFn: ((req: NextRequest) => string) | string,
) {
  return function wrap(
    handler: (req: NextRequest, context: { userId: string }) => Promise<Response>,
  ) {
    return async (request: NextRequest): Promise<Response> => {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const meta = getRequestMeta(request);
      const description =
        typeof descriptionFn === "function" ? descriptionFn(request) : descriptionFn;
      const userId = session.user.id!;

      const context = { userId };

      try {
        const response = await handler(request, context);
        const success = response.status < 400;

        // Log the activity asynchronously (don't block response)
        logActivity({
          action,
          module,
          description: success ? description : `${description} (failed)`,
          userId,
          severity: success ? "INFO" : "ERROR",
          ip: meta.ip,
          userAgent: meta.userAgent,
          country: meta.country,
        }).catch(() => {});

        return response;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        logActivity({
          action: `${action}_error`,
          module,
          description: `${description}: ${errorMsg}`,
          userId,
          severity: "ERROR",
          ip: meta.ip,
          userAgent: meta.userAgent,
          country: meta.country,
        }).catch(() => {});
        throw error;
      }
    };
  };
}
