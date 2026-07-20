export interface LeadIntentResult {
  isLead: boolean;
  confidence: number;
  suggestsBooking: boolean;
  projectType?: string;
}

const LEAD_PATTERNS = [
  { pattern: /\b(need|want|looking for|require|interested in)\s.*(website|app|software|system|web|platform|solution)/i, projectType: "web_development", confidence: 0.8 },
  { pattern: /\b(need|want|looking for|require|interested in)\s.*(ecommerce|e-commerce|shop|store|marketplace)/i, projectType: "ecommerce", confidence: 0.8 },
  { pattern: /\b(need|want|looking for|require|interested in)\s.*(crm|customer|sales|pipeline)/i, projectType: "crm", confidence: 0.8 },
  { pattern: /\b(need|want|looking for|require|interested in)\s.*(mobile|ios|android|app)/i, projectType: "mobile_app", confidence: 0.7 },
  { pattern: /\b(need|want|looking for|require|interested in)\s.*(wordpress|wp|blog)/i, projectType: "wordpress", confidence: 0.8 },
  { pattern: /\b(need|want|looking for|require|interested in)\s.*(api|integration|rest|graphql)/i, projectType: "api", confidence: 0.7 },
  { pattern: /\b(hire|freelance|contract|project|quote|estimate|pricing|cost|price|budget)/i, confidence: 0.6 },
  { pattern: /\b(consult|consulting|consultation|advice|expert)/i, confidence: 0.5 },
  { pattern: /\b(developer|develop|build|create|custom)\s.*(for|my|our)/i, confidence: 0.6 },
];

const BOOKING_PATTERNS = [
  /\b(book|schedule|appointment|call|meeting|consult|consultation)\s/i,
  /\b(when|available|free|time|slot)\s.*(talk|chat|call|meet)/i,
  /\b(set up|arrange|organize)\s.*(call|meeting|chat)/i,
];

const FRONTEND_LEAD_KEYWORDS = [
  "hire", "services", "pricing", "price", "cost", "quote", "estimate",
  "project", "freelance", "contract", "work with", "get started",
  "consultation", "book", "call", "meeting", "proposal", "collaborate",
  "partnership", "rates", "budget", "available", "interested",
];

/**
 * Quick frontend-side lead intent check (fast keyword match).
 * Used by ChatProvider and FullPageChat to decide whether to show the contact form.
 * For full backend analysis, use detectLeadIntent instead.
 */
export function detectFrontendLeadIntent(content: string): boolean {
  const lower = content.toLowerCase();
  return FRONTEND_LEAD_KEYWORDS.some((kw) => lower.includes(kw));
}

export function detectLeadIntent(message: string): LeadIntentResult {
  let highestConfidence = 0;
  let projectType: string | undefined;
  let isLead = false;

  for (const { pattern, projectType: pt, confidence } of LEAD_PATTERNS) {
    if (pattern.test(message) && confidence > highestConfidence) {
      highestConfidence = confidence;
      projectType = pt;
      isLead = true;
    }
  }

  const suggestsBooking = BOOKING_PATTERNS.some((p) => p.test(message));

  return { isLead, confidence: highestConfidence, suggestsBooking, projectType };
}

export async function extractLeadInfo(messages: { role: string; content: string }[]): Promise<{
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  requirements?: string;
}> {
  const fullText = messages.map((m) => m.content).join(" ");

  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = fullText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  const nameMatch = fullText.match(/my name is ([A-Z][a-z]+ (?:(?:de |van |von )?[A-Z][a-z]+)?)/);
  const companyMatch = fullText.match(/(?:at|for|from)\s+(?:my\s+)?(?:company|business|agency|startup|organization|firm)\s+(?:called\s+)?['"]?([A-Z][A-Za-z0-9\s&]+)['"]?/i);

  return {
    name: nameMatch?.[1] ?? undefined,
    email: emailMatch?.[0] ?? undefined,
    phone: phoneMatch?.[0] ?? undefined,
    company: companyMatch?.[1]?.trim() ?? undefined,
    requirements: fullText.slice(0, 500),
  };
}

export function detectLanguage(text: string): string {
  const langPatterns: Record<string, RegExp> = {
    fr: /[éèêëàâäùûüôöîïçœ]/i,
    pt: /[áàâãéêíóôõúç]/i,
    es: /[áéíóúñü¿¡]/i,
    de: /[äöüß]/i,
    it: /[àèéìíîòóùú]/i,
    ar: /[\u0600-\u06FF]/,
    zh: /[\u4e00-\u9fff]/,
    ja: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/,
    ko: /[\uac00-\ud7af\u1100-\u11ff]/,
  };

  for (const [lang, pattern] of Object.entries(langPatterns)) {
    if (pattern.test(text)) return lang;
  }
  return "en";
}
