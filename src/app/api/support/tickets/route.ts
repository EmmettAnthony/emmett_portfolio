import { NextResponse, NextRequest } from "next/server";
import {
  searchTicketsSchema
} from "@/lib/validations/support";
import { createTicketAction, searchTicketsAction } from "@/actions/support/tickets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = searchTicketsSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid params", details: parsed.error.flatten() }, { status: 400 });
    }
    const result = await searchTicketsAction(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/support/tickets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createTicketAction(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/support/tickets error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Validation failed")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
