import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/get-site-settings";

export const revalidate = 60;

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch site settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
