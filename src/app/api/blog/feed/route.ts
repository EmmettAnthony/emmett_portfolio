export const dynamic = "force-dynamic";

import { getPrisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/get-site-settings";
import { escapeHtml } from "@/lib/utils/string-guards";

function escapeXml(text: string): string {
  return escapeHtml(text).replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  return date.toUTCString();
}

export async function GET() {
  try {
    const prisma = getPrisma();
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: true,
        tags: true,
        category: true,
        image: true,
        publishedAt: true,
      },
    });

    const settings = await getSiteSettings();
    const siteUrl = settings.url;

    const items = posts.map((post) => {
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      const tags = post.tags ? JSON.parse(post.tags) : [];
      const tagCategories = tags
        .map((tag: string) => `<category>${escapeXml(tag)}</category>`)
        .join("");

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description>${escapeXml(post.excerpt || "")}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <pubDate>${formatDate(post.publishedAt || post.createdAt)}</pubDate>
      <author>${escapeXml(post.author || settings.siteName)}</author>
      ${tagCategories}
      <category>${escapeXml(post.category || "")}</category>
    </item>`;
    });

    const lastBuildDate =
      posts.length > 0
        ? formatDate(posts[0].publishedAt || posts[0].createdAt)
        : formatDate(new Date());

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(settings.siteName)}</title>
    <description>${escapeXml(settings.description)}</description>
    <link>${escapeXml(siteUrl)}</link>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(siteUrl)}/api/blog/feed" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Portfolio</title>
    <description></description>
    <link></link>
  </channel>
</rss>`,
      {
        status: 200,
        headers: { "Content-Type": "application/xml; charset=utf-8" },
      }
    );
  }
}
