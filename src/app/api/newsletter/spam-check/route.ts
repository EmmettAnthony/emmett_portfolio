import { NextResponse } from "next/server";
import { auth } from "@/../auth";
import { checkSpamScore } from "@/lib/spam-check";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
      return NextResponse.json({ error: "Content must be a string" }, { status: 400 });
    }

    const result = checkSpamScore(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Spam check failed:", error);
    return NextResponse.json({ error: "Spam check failed" }, { status: 500 });
  }
}
