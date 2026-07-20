import { describe, it, expect } from "vitest";
import { buildRssEmailHtml, type RssFeedItem } from "../rss";

describe("buildRssEmailHtml", () => {
  const items: RssFeedItem[] = [
    { title: "Post 1", link: "https://example.com/1", description: "First post", content: "Full content 1", pubDate: "2024-01-01", guid: "1" },
    { title: "Post 2", link: "https://example.com/2", description: "Second post", content: "Full content 2", pubDate: "2024-01-15", guid: "2" },
  ];

  it("includes the title in the output", () => {
    const html = buildRssEmailHtml(items, "Test Digest");
    expect(html).toContain("Test Digest");
  });

  it("includes all item titles as links", () => {
    const html = buildRssEmailHtml(items, "Digest");
    expect(html).toContain("Post 1");
    expect(html).toContain("Post 2");
    expect(html).toContain("https://example.com/1");
    expect(html).toContain("https://example.com/2");
  });

  it("includes item descriptions", () => {
    const html = buildRssEmailHtml(items, "Digest");
    expect(html).toContain("First post");
    expect(html).toContain("Second post");
  });

  it("returns an HTML table structure", () => {
    const html = buildRssEmailHtml(items, "Digest");
    expect(html).toContain("<table");
    expect(html).toContain("</table>");
  });

  it("handles empty items array", () => {
    const html = buildRssEmailHtml([], "Empty");
    expect(html).toContain("Empty");
  });
});
