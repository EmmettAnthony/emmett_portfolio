import { z } from "zod";

const emailField = z.string().email("Invalid email address").max(320);
const nameField = z.string().min(1, "Name is required").max(255);
const optionalPhoneField = z.string().max(50).optional().nullable();
const optionalCompanyField = z.string().max(255).optional().nullable();

export const PROJECT_TYPES = [
  { value: "web_development", label: "Web Development" },
  { value: "mobile_app", label: "Mobile App" },
  { value: "crm_system", label: "CRM System" },
  { value: "ecommerce", label: "E-Commerce" },
  { value: "api_integration", label: "API Integration" },
  { value: "consulting", label: "Consulting" },
  { value: "wordpress", label: "WordPress" },
  { value: "other", label: "Other" },
] as const;

export const BUDGET_RANGES = [
  { value: "under_1000", label: "Under $1,000" },
  { value: "1000_5000", label: "$1,000 - $5,000" },
  { value: "5000_10000", label: "$5,000 - $10,000" },
  { value: "10000_25000", label: "$10,000 - $25,000" },
  { value: "25000_plus", label: "$25,000+" },
  { value: "not_sure", label: "Not Sure" },
] as const;

export const TIMELINE_OPTIONS = [
  { value: "asap", label: "ASAP (1-2 weeks)" },
  { value: "short", label: "Short (2-4 weeks)" },
  { value: "medium", label: "Medium (1-3 months)" },
  { value: "flexible", label: "Flexible (3+ months)" },
  { value: "not_sure", label: "Not Sure" },
] as const;

const projectTypeValues = PROJECT_TYPES.map((p) => p.value) as [string, ...string[]];

export const contactFormSchema = z.object({
  name: nameField,
  email: emailField,
  phone: optionalPhoneField,
  company: optionalCompanyField,
  projectType: z.enum(projectTypeValues, { error: "Please select a valid project type" }),
  budget: z.string().optional().default(""),
  timeline: z.string().optional().default(""),
  subject: z.string().min(1, "Subject is required").max(500),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
  fileUrl: z.string().optional().default(""),
  fileName: z.string().optional().default(""),
  honeypot: z.string().max(0, "Bot detected").optional().default(""),
  turnstileToken: z.string().optional(),
});

export type ContactFormInput = z.input<typeof contactFormSchema>;
export type ContactFormOutput = z.output<typeof contactFormSchema>;
