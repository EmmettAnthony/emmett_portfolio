import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "unknown",
    version: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || undefined,
  };

  return NextResponse.json(status, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
