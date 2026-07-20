import { prisma } from "@/lib/db";
import { searchByVector } from "./embeddings";

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[];
  score: number;
  source: string | null;
  sourceUrl: string | null;
}

export async function searchKnowledgeBase(query: string, limit = 5): Promise<SearchResult[]> {
  const vectorIds = await searchByVector(query, limit);

  let results;
  if (vectorIds.length > 0) {
    results = await prisma.knowledgeBase.findMany({
      where: { id: { in: vectorIds }, enabled: true },
      include: { category: true },
    });
    const idOrder = Object.fromEntries(vectorIds.map((id, i) => [id, i]));
    results.sort((a, b) => (idOrder[a.id] ?? 99) - (idOrder[b.id] ?? 99));
  } else {
    results = await prisma.knowledgeBase.findMany({
      where: {
        enabled: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        { tags: { has: query.toLowerCase() } },
        ],
      },
      take: limit,
      include: { category: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content.slice(0, 1000),
    category: item.category?.name ?? null,
    tags: item.tags,
    score: calculateRelevance(item.title, item.content, query),
    source: item.source,
    sourceUrl: item.sourceUrl,
  }));
}

export async function searchPortfolio(query: string): Promise<SearchResult[]> {
  const results = await prisma.project.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
  });

  return results.map((item) => ({
    id: item.id,
    title: item.name,
    content: item.description ?? "",
    category: "Portfolio",
    tags: (item.tags ?? "").split(",").map((t) => t.trim()).filter(Boolean),
    score: calculateRelevance(item.name, item.description ?? "", query),
    source: "portfolio",
    sourceUrl: `/portfolio/${item.slug}`,
  }));
}

export async function searchBlogPosts(query: string): Promise<SearchResult[]> {
  const results = await prisma.blogPost.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
        { tags: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 5,
    select: {
      id: true,
      title: true,
      excerpt: true,
      slug: true,
      tags: true,
    },
  });

  return results.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.excerpt ?? "",
    category: "Blog",
    tags: item.tags ? [item.tags] : [],
    score: calculateRelevance(item.title, item.excerpt ?? "", query),
    source: "blog",
    sourceUrl: `/blog/${item.slug}`,
  }));
}

export async function searchResume(): Promise<SearchResult[]> {
  const resume = await prisma.resumeProfile.findFirst({
    where: { published: true },
    include: {
      experiences: true,
      education: true,
      skills: true,
      certifications: true,
    },
  });

  if (!resume) return [];

  const results: SearchResult[] = [];

  // Add resume overview
  results.push({
    id: resume.id,
    title: "Resume - Professional Overview",
    content: resume.summary ?? `${resume.fullName} - ${resume.professionalTitle}`,
    category: "Resume",
    tags: ["resume", "experience", "skills"],
    score: 1,
    source: "resume",
    sourceUrl: "/resume",
  });

  // Add experience entries
  for (const exp of resume.experiences) {
    const resp = Array.isArray(exp.responsibilities) ? exp.responsibilities : [];
    results.push({
      id: `exp-${exp.id}`,
      title: `${exp.jobTitle} at ${exp.company}`,
      content: resp.slice(0, 3).join("; "),
      category: "Experience",
      tags: ["experience", exp.company.toLowerCase()],
      score: 1,
      source: "resume",
      sourceUrl: "/resume",
    });
  }

  return results;
}

function calculateRelevance(title: string, content: string, query: string): number {
  const q = query.toLowerCase();
  const titleLower = title.toLowerCase();
  const contentLower = content.toLowerCase();
  let score = 0;

  if (titleLower.includes(q)) score += 3;
  if (contentLower.includes(q)) score += 1;

  const queryWords = q.split(/\s+/);
  for (const word of queryWords) {
    if (word.length < 2) continue;
    if (titleLower.includes(word)) score += 1;
    if (contentLower.includes(word)) score += 0.5;
  }

  return score;
}

export async function searchSupportKnowledgeBase(query: string, limit = 3): Promise<SearchResult[]> {
  try {
    const { prisma } = await import("@/lib/db");
    const articles = await prisma.supportKnowledgeArticle.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { excerpt: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
          { tags: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { viewCount: "desc" },
      include: { category: { select: { name: true } } },
    });

    return articles.map((a, i) => ({
      id: a.id,
      title: a.title,
      content: a.excerpt || a.content.substring(0, 300),
      category: a.category?.name || "Support",
      tags: (a.tags ? JSON.parse(a.tags) : []) as string[],
      score: limit - i,
      source: "knowledge_base",
      sourceUrl: `/support/knowledge-base`,
    }));
  } catch {
    return [];
  }
}

export async function searchAll(query: string): Promise<SearchResult[]> {
  const [knowledge, portfolio, blog, resume, supportKb] = await Promise.all([
    searchKnowledgeBase(query),
    searchPortfolio(query),
    searchBlogPosts(query),
    searchResume(),
    searchSupportKnowledgeBase(query),
  ]);

  const all = [...knowledge, ...portfolio, ...blog, ...resume, ...supportKb];
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, 10);
}
