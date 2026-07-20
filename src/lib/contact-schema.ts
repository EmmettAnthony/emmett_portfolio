import { z } from "zod";

export const projectTypes = [
  "Business Website",
  "E-Commerce Website",
  "Web Application",
  "SaaS Platform",
  "WordPress Website",
  "Website Redesign",
  "Website Maintenance",
  "Technical Consultation",
  "API Integration",
  "Custom Software",
  "Other",
] as const;

export const budgetRanges = [
  "Under $500",
  "$500 - $1,000",
  "$1,000 - $5,000",
  "$5,000 - $10,000",
  "$10,000+",
] as const;

export const timelines = [
  "ASAP",
  "Within 1 Month",
  "1-3 Months",
  "3-6 Months",
  "Flexible",
] as const;

export const referralSources = [
  "Google Search",
  "LinkedIn",
  "GitHub",
  "Referral",
  "Social Media",
  "Previous Client",
  "Other",
] as const;

export const communicationMethods = [
  "Email",
  "Phone",
  "WhatsApp",
  "Zoom Meeting",
] as const;

export const contactSchema = z.object({
  // Required fields
  fullName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  projectType: z.enum(projectTypes, {
    error: "Please select a project type",
  }),
  projectDetails: z
    .string()
    .min(20, "Please provide at least 20 characters describing your project")
    .max(5000, "Project details must be under 5000 characters"),

  // Optional fields
  company: z.string().max(200).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[\d\s\-+()]*$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  budget: z.enum(budgetRanges).optional().or(z.literal("")),
  timeline: z.enum(timelines).optional().or(z.literal("")),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  startDate: z.string().optional().or(z.literal("")),
  referralSource: z.enum(referralSources).optional().or(z.literal("")),

  // New optional fields
  projectGoals: z.string().max(2000).optional().or(z.literal("")),
  hasExistingWebsite: z.boolean().optional(),
  existingWebsiteUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  preferredContactMethod: z.enum(communicationMethods).optional().or(z.literal("")),

  // Honeypot - must be empty
  honeypot: z.string().max(0, "Bot detected").optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export interface ContactFormState {
  status: "idle" | "loading" | "success" | "error";
  message: string;
}

export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

export const ACCEPTED_FILE_EXTENSIONS = ".pdf,.docx,.png,.jpg,.jpeg";
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(file: File): string | null {
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    return "Invalid file type. Accepted: PDF, DOCX, PNG, JPG";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File is too large. Maximum size is 10MB";
  }
  return null;
}

export function calculateLeadScore(data: ContactFormData): number {
  let score = 0;

  // Budget-based scoring
  if (data.budget === "$5,000 - $10,000" || data.budget === "$10,000+") {
    score += 30;
  } else if (data.budget === "$1,000 - $5,000") {
    score += 20;
  } else if (data.budget === "$500 - $1,000") {
    score += 10;
  } else if (data.budget === "Under $500") {
    score += 5;
  }

  // Referral source scoring
  if (data.referralSource === "Previous Client" || data.referralSource === "Referral") {
    score += 20;
  } else if (data.referralSource === "LinkedIn" || data.referralSource === "GitHub") {
    score += 10;
  }

  // Profile completeness
  if (data.fullName) score += 5;
  if (data.company) score += 5;
  if (data.phone) score += 5;
  if (data.website) score += 5;
  if (data.projectGoals) score += 5;
  if (data.preferredContactMethod) score += 5;

  // Project detail length
  if (data.projectDetails.length > 100) score += 10;
  else if (data.projectDetails.length > 50) score += 5;

  // Timeline urgency
  if (data.timeline === "ASAP") score += 10;
  else if (data.timeline === "Within 1 Month") score += 5;

  return Math.min(score, 100);
}
