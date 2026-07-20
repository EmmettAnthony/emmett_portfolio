export interface SpamCheckResult {
  score: number;
  flags: string[];
  level: "safe" | "moderate" | "high";
}

const SPAM_TRIGGER_WORDS = [
  "free", "guaranteed", "act now", "limited time", "click here",
  "congratulations", "winner", "urgent", "exclusive", "offer",
  "buy now", "order now", "call now", "don't delete", "immediately",
  "limited offer", "new customers only", "no cost", "no obligation",
  "promise you", "risk free", "satisfaction guaranteed", "save big",
  "special promotion", "subscribe now", "terms and conditions apply",
  "this is not spam", "unlimited", "while supplies last", "you have been selected",
  "amazing", "bargain", "bonus", "cash", "discount", "earn money",
  "great deal", "hurry up", "increase sales", "instant", "incredible",
  "investment", "lowest price", "miracle", "no fees", "priceless",
];

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

function extractUrls(html: string): string[] {
  const urls: string[] = [];
  const hrefRegex = /href\s*=\s*["'](.*?)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = hrefRegex.exec(html)) !== null) {
    urls.push(match[1]);
  }
  const bareUrlRegex = /https?:\/\/[^\s"'>]+/gi;
  while ((match = bareUrlRegex.exec(html)) !== null) {
    const url = match[0];
    if (!urls.includes(url)) urls.push(url);
  }
  return urls;
}

function hasIpAddress(url: string): boolean {
  const ipRegex = /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/;
  return ipRegex.test(url);
}

function hasRedirectPattern(url: string): boolean {
  const redirectPatterns = [
    /\/redirect/i, /\/go\//i, /\/out\//i, /\/link\//i,
    /\?redirect=/i, /&redirect=/i, /\/click\//i,
    /\/track\//i, /\/r\//i,
  ];
  return redirectPatterns.some((p) => p.test(url));
}

function extractTextContent(html: string): string {
  const text = stripHtml(html);
  return text.replace(/\s+/g, " ").trim();
}

export function checkSpamScore(content: string): SpamCheckResult {
  const flags: string[] = [];
  let score = 0;
  const text = extractTextContent(content);
  const urls = extractUrls(content);
  const lowerContent = content.toLowerCase();

  // 1. Excessive capitalization (>30% uppercase letters)
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 0) {
    const upperLetters = text.replace(/[^A-Z]/g, "").length;
    const upperRatio = upperLetters / letters.length;
    if (upperRatio > 0.3) {
      score += 15;
      flags.push("Excessive capitalization");
    }
  }

  // 2. Too many exclamation marks
  const exclamationCount = (text.match(/!/g) || []).length;
  const consecutiveExclams = (text.match(/!{3,}/g) || []).length > 0;
  if (exclamationCount > 5 || consecutiveExclams) {
    score += 10;
    flags.push("Too many exclamation marks");
  }

  // 3. Spam trigger words (+5 each, max +40)
  let triggerScore = 0;
  const triggeredCategories: string[] = [];
  for (const word of SPAM_TRIGGER_WORDS) {
    if (lowerContent.includes(word)) {
      triggerScore += 5;
      if (!triggeredCategories.includes("Spam trigger words found")) {
        triggeredCategories.push("Spam trigger words found");
      }
    }
  }
  score += Math.min(triggerScore, 40);
  if (triggeredCategories.length > 0) {
    flags.push(triggeredCategories[0]);
  }

  // 4. No unsubscribe link
  if (!lowerContent.includes("unsubscribe")) {
    score += 20;
    flags.push("No unsubscribe link found");
  }

  // 5. Single image with no text content
  const imgTags = (content.match(/<img[^>]*>/gi) || []).length;
  const textLength = text.replace(/\s/g, "").length;
  if (imgTags >= 1 && textLength < 50) {
    score += 15;
    flags.push("Image-only email");
  }

  // 6. Too many links for short content
  const linkCount = (content.match(/<a\s[^>]*>/gi) || []).length;
  if (linkCount > 10 && textLength < 500) {
    score += 10;
    flags.push("Excessive links");
  }

  // 7. Large font sizes (>40px)
  const fontSizeRegex = /font-size\s*:\s*(\d+)\s*px/gi;
  let fontSizeMatch: RegExpExecArray | null;
  let hasLargeFont = false;
  while ((fontSizeMatch = fontSizeRegex.exec(content)) !== null) {
    if (parseInt(fontSizeMatch[1], 10) > 40) {
      hasLargeFont = true;
      break;
    }
  }
  if (hasLargeFont) {
    score += 5;
    flags.push("Oversized fonts");
  }

  // 8. Too much bold/red text
  const boldCount = (content.match(/<(strong|b)\s*[^>]*>/gi) || []).length;
  const redCount = (content.match(/color\s*:\s*red/gi) || []).length;
  if (boldCount > 5 || redCount > 3) {
    score += 5;
    flags.push("Excessive formatting");
  }

  // 9. No plain text version (content is HTML with no plain text alt)
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
  if (hasHtmlTags && textLength < 20) {
    score += 5;
    flags.push("No plain text version");
  }

  // 10. Suspicious URLs
  const suspiciousUrls = urls.filter((url) => hasIpAddress(url) || hasRedirectPattern(url));
  if (suspiciousUrls.length > 0) {
    score += 10;
    flags.push("Suspicious URLs");
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  let level: SpamCheckResult["level"];
  if (score >= 60) level = "high";
  else if (score >= 30) level = "moderate";
  else level = "safe";

  return { score, flags, level };
}
