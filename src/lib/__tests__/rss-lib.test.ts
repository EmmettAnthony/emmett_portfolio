import { describe, it, expect, vi, beforeEach } from "vitest";
import type { RssFeedItem } from "../rss";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.restoreAllMocks();
  mockFetch.mockReset();
  vi.spyOn(globalThis, "fetch").mockImplementation(mockFetch);
});

function makeXml(items: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?><rss><channel>${items.join("\n")}</channel></rss>`;
}

function makeItem(overrides: Record<string, string> = {}): string {
  const title = overrides.title ?? "Test Post";
  const link = overrides.link ?? "https://example.com/post";
  const description = overrides.description ?? "A test description";
  const content = overrides.content ?? description;
  const pubDate = overrides.pubDate ?? "Mon, 01 Jan 2024 00:00:00 GMT";
  const guid = overrides.guid ?? link;
  const titleTag = title.includes("<![CDATA[") ? `<title>${title}</title>` : `<title><![CDATA[${title}]]></title>`;
  const linkTag = `<link>${link}</link>`;
  const descTag = description.includes("<![CDATA[") ? `<description>${description}</description>` : `<description><![CDATA[${description}]]></description>`;
  const contentTag = content === description ? "" : content.includes("<![CDATA[") ? `<content:encoded>${content}</content:encoded>` : `<content:encoded><![CDATA[${content}]]></content:encoded>`;
  const pubDateTag = `<pubDate>${pubDate}</pubDate>`;
  const guidTag = `<guid>${guid}</guid>`;
  return `<item>${titleTag}${linkTag}${descTag}${contentTag}${pubDateTag}${guidTag}</item>`;
}

describe("fetchRssFeed", () => {
  it("fetches and parses RSS XML with CDATA content", async () => {
    const xml = makeXml([makeItem({ title: "Post 1", content: "Full content 1" })]);
    mockFetch.mockResolvedValue({ text: () => Promise.resolve(xml) });

    const { fetchRssFeed } = await import("../rss");
    const items = await fetchRssFeed("https://example.com/feed");

    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Post 1");
    expect(items[0].link).toBe("https://example.com/post");
    expect(items[0].description).toBe("A test description");
    expect(items[0].content).toBe("Full content 1");
    expect(items[0].pubDate).toBe("Mon, 01 Jan 2024 00:00:00 GMT");
    expect(items[0].guid).toBe("https://example.com/post");
  });

  it("extracts non-CDATA content", async () => {
    const xml = makeXml([makeItem({ title: "Plain Title", description: "Plain description", content: "" })]);
    mockFetch.mockResolvedValue({ text: () => Promise.resolve(xml) });

    const { fetchRssFeed } = await import("../rss");
    const items = await fetchRssFeed("https://example.com/feed");

    expect(items[0].title).toBe("Plain Title");
    expect(items[0].description).toBe("Plain description");
    expect(items[0].content).toBe("Plain description");
  });

  it("respects limit parameter", async () => {
    const xml = makeXml([makeItem({ title: "Post 1" }), makeItem({ title: "Post 2" }), makeItem({ title: "Post 3" })]);
    mockFetch.mockResolvedValue({ text: () => Promise.resolve(xml) });

    const { fetchRssFeed } = await import("../rss");
    const items = await fetchRssFeed("https://example.com/feed", 2);

    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Post 1");
    expect(items[1].title).toBe("Post 2");
  });

  it("falls back to link when guid is missing", async () => {
    const xml = makeXml([`<item>
      <title><![CDATA[No GUID]]></title>
      <link>https://example.com/no-guid</link>
      <description><![CDATA[Desc]]></description>
      <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
    </item>`]);
    mockFetch.mockResolvedValue({ text: () => Promise.resolve(xml) });

    const { fetchRssFeed } = await import("../rss");
    const items = await fetchRssFeed("https://example.com/feed");

    expect(items[0].guid).toBe("https://example.com/no-guid");
  });

  it("handles empty feed", async () => {
    const xml = makeXml([]);
    mockFetch.mockResolvedValue({ text: () => Promise.resolve(xml) });

    const { fetchRssFeed } = await import("../rss");
    const items = await fetchRssFeed("https://example.com/feed");

    expect(items).toHaveLength(0);
  });

  it("handles XML with no items", async () => {
    mockFetch.mockResolvedValue({ text: () => Promise.resolve("<?xml version='1.0'?><rss><channel></channel></rss>") });

    const { fetchRssFeed } = await import("../rss");
    const items = await fetchRssFeed("https://example.com/feed");

    expect(items).toHaveLength(0);
  });
});

describe("buildRssEmailHtml", () => {
  it("includes title in output", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const html = buildRssEmailHtml([], "Weekly Digest");
    expect(html).toContain("Weekly Digest");
  });

  it("includes item titles as links", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const items: RssFeedItem[] = [
      { title: "Post 1", link: "https://example.com/1", description: "First", content: "Full 1", pubDate: "2024-01-01", guid: "1" },
      { title: "Post 2", link: "https://example.com/2", description: "Second", content: "Full 2", pubDate: "2024-01-15", guid: "2" },
    ];
    const html = buildRssEmailHtml(items, "Digest");
    expect(html).toContain("Post 1");
    expect(html).toContain("Post 2");
    expect(html).toContain("https://example.com/1");
    expect(html).toContain("https://example.com/2");
  });

  it("includes item descriptions", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const items: RssFeedItem[] = [
      { title: "P1", link: "https://ex.com/1", description: "First desc", content: "Full", pubDate: "2024-01-01", guid: "1" },
    ];
    const html = buildRssEmailHtml(items, "Digest");
    expect(html).toContain("First desc");
  });

  it("renders date using toLocaleDateString", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const items: RssFeedItem[] = [
      { title: "P1", link: "https://ex.com/1", description: "Desc", content: "Full", pubDate: "2024-01-01", guid: "1" },
    ];
    const html = buildRssEmailHtml(items, "Digest");
    expect(html).toContain("1/1/2024");
  });

  it("returns HTML table structure", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const items: RssFeedItem[] = [
      { title: "P1", link: "https://ex.com/1", description: "Desc", content: "Full", pubDate: "2024-01-01", guid: "1" },
    ];
    const html = buildRssEmailHtml(items, "Digest");
    expect(html).toContain("<table");
    expect(html).toContain("</table>");
  });

  it("handles empty items array", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const html = buildRssEmailHtml([], "Empty");
    expect(html).toContain("Empty");
    expect(html).toContain("</table>");
  });

  it("includes newsletter footer", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const html = buildRssEmailHtml([], "Digest");
    expect(html).toContain("You're receiving this because you subscribed");
  });

  it("renders multiple items with separators", async () => {
    const { buildRssEmailHtml } = await import("../rss");
    const items: RssFeedItem[] = [
      { title: "A", link: "https://ex.com/a", description: "Desc A", content: "Full A", pubDate: "2024-01-01", guid: "a" },
      { title: "B", link: "https://ex.com/b", description: "Desc B", content: "Full B", pubDate: "2024-01-02", guid: "b" },
    ];
    const html = buildRssEmailHtml(items, "Digest");
    const firstIndex = html.indexOf("Desc A");
    const secondIndex = html.indexOf("Desc B");
    expect(firstIndex).toBeGreaterThan(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });
});
