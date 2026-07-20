import { NextResponse } from "next/server";
import { getTestimonialPageSettings } from "@/lib/helpers/testimonial-settings";

export async function GET() {
  const settings = await getTestimonialPageSettings();
  return NextResponse.json(settings);
}
