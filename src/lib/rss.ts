export interface RssFeedItem {
  title: string;
  link: string;
  description: string;
  content: string;
  pubDate: string;
  guid: string;
}

export async function fetchRssFeed(url: string, limit = 10): Promise<RssFeedItem[]> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  const xml = await res.text();

  const items: RssFeedItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const itemXml = match[1];
    items.push({
      title: extractXmlValue(itemXml, "title"),
      link: extractXmlValue(itemXml, "link"),
      description: extractXmlValue(itemXml, "description"),
      content: extractXmlValue(itemXml, "content:encoded") || extractXmlValue(itemXml, "description"),
      pubDate: extractXmlValue(itemXml, "pubDate"),
      guid: extractXmlValue(itemXml, "guid") || extractXmlValue(itemXml, "link"),
    });
  }

  return items;
}

function extractXmlValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = regex.exec(xml);
  return (match?.[1] || match?.[2] || "").trim();
}

export function buildRssEmailHtml(items: RssFeedItem[], title: string): string {
  const itemHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding:20px 0;border-bottom:1px solid #e4e4e7;">
        <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;">
          <a href="${item.link}" style="color:#2563eb;text-decoration:none;">${item.title}</a>
        </h3>
        <p style="margin:0;font-size:14px;color:#52525b;line-height:1.5;">${item.description}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;">${new Date(item.pubDate).toLocaleDateString()}</p>
      </td>
    </tr>`
    )
    .join("\n");

  return `
<table cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;font-family:system-ui,sans-serif;">
  <tr><td style="padding:30px 0 10px;"><h1 style="margin:0;font-size:22px;font-weight:700;">${title}</h1></td></tr>
  ${itemHtml}
  <tr><td style="padding:20px 0;text-align:center;font-size:12px;color:#a1a1aa;">
    You're receiving this because you subscribed to our newsletter.
  </td></tr>
</table>`;
}
