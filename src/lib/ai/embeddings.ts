const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

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
    const entries = await prisma.knowledgeBase.findMany({
      where: { enabled: true, embedding: { not: null } },
      select: { id: true, title: true, content: true, embedding: true },
    });

    const scored = entries
      .map((e: { id: string; embedding: string | null }) => {
        const vec = JSON.parse(e.embedding!) as number[];
        return { id: e.id, score: cosineSimilarity(embedding, vec) };
      })
      .sort((a: { id: string; score: number }, b: { id: string; score: number }) => b.score - a.score)
      .slice(0, limit);

    return scored.map((r: { id: string; score: number }) => r.id);
  } catch {
    return [];
  }
}
