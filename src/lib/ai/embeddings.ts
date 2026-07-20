const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.slice(0, 8000),
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

export async function searchByVector(query: string, limit = 5): Promise<string[]> {
  const embedding = await generateEmbedding(query);
  if (!embedding) return [];

  try {
    const { prisma } = await import("@/lib/db");
    const vectorStr = `[${embedding.join(",")}]`;

    const results = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM "knowledge_base" WHERE enabled = true AND embedding IS NOT NULL ORDER BY embedding <=> $1::vector LIMIT $2`,
      vectorStr,
      limit
    );

    return results.map((r) => r.id);
  } catch {
    return [];
  }
}
