import { z } from "zod";

export const TESTIMONIAL_CATEGORIES = [
  "Web Development", "E-Commerce", "Software Development",
  "WordPress Development", "Consulting", "Website Maintenance",
] as const;

export const testimonialSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  jobTitle: z.string().max(200).optional().default(""),
  company: z.string().max(200).optional().default(""),
  companyWebsite: z.string().url("Invalid URL").or(z.literal("")).optional().default(""),
  email: z.string().email("Invalid email").or(z.literal("")).optional().default(""),
  photo: z.string().url("Invalid URL").or(z.literal("")).optional().default(""),
  companyLogo: z.string().url("Invalid URL").or(z.literal("")).optional().default(""),
  title: z.string().max(300).optional().default(""),
  content: z.string().min(1, "Content is required").max(1000, "Content must be under 1000 characters"),
  rating: z.number().int().min(1).max(5),
  projectName: z.string().max(200).optional().default(""),
  projectCategory: z.string().max(200).optional().default(""),
  category: z.string().max(200).optional().default(""),
  status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]).default("PENDING_REVIEW"),
  featured: z.boolean().default(false),
  displayOnHomepage: z.boolean().default(true),
  archived: z.boolean().default(false),
  order: z.number().int().default(0),
  metaTitle: z.string().max(200).optional().default(""),
  metaDescription: z.string().max(500).optional().default(""),
  ogImage: z.string().url("Invalid URL").or(z.literal("")).optional().default(""),
});

export const testimonialSubmissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").or(z.literal("")).optional().default(""),
  company: z.string().max(200).optional().default(""),
  jobTitle: z.string().max(200).optional().default(""),
  photo: z.string().url("Invalid URL").or(z.literal("")).optional().default(""),
  rating: z.number().int().min(1).max(5).default(5),
  content: z.string().min(1, "Content is required").max(1000),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type TestimonialSubmissionInput = z.infer<typeof testimonialSubmissionSchema>;
