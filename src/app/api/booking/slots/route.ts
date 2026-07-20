import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability/slots";
import { checkRateLimit } from "@/lib/security";

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
  const rl = checkRateLimit(`slots:${ip}`, { maxRequests: 60, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");
  const durationParam = searchParams.get("duration");

  if (!dateStr) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  const parsed = parseInt(durationParam || "30", 10);
  const duration = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return NextResponse.json([], { status: 200 });
  }

  const slots = await getAvailableSlots(date, duration);

  return NextResponse.json(slots);
}