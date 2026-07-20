import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { searchAll } from "@/lib/ai/rag";
import { searchKnowledgeBase } from "@/lib/ai/rag";

export async function GET(request: NextRequest) {
  try {
    const rl = await checkRateLimit(request, "chat-search", 30, 60_000);
    if (!rl.passed) return rl.response;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const scope = searchParams.get("scope") || "all";
    const limit = parseInt(searchParams.get("limit") || "5");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    let results;

    if (scope === "knowledge") {
      results = await searchKnowledgeBase(query, limit);
    } else {
      results = await searchAll(query);
      results = results.slice(0, limit);
    }

    return NextResponse.json({ results, query, total: results.length });
  } catch (error) {
    console.error("Search failed:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
