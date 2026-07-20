import { z } from "zod";

export const createServiceCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Must be a valid slug"),
  description: z.string().max(500).nullable().optional(),
  icon: z.string().max(50).nullable().optional(),
  image: z.string().max(500).nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export const updateServiceCategorySchema = createServiceCategorySchema.partial();

export const createServicePackageSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  price: z.number().min(0, "Price must be 0 or more"),
  features: z.array(z.string()).optional().default([]),
  deliveryTime: z.string().max(100).nullable().optional(),
  revisions: z.number().int().min(0).optional().default(0),
  supportDuration: z.string().max(100).nullable().optional(),
  isPopular: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional(),
  serviceId: z.string().min(1, "Service is required"),
});

export const updateServicePackageSchema = createServicePackageSchema.partial();

export const createServiceFaqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  order: z.number().int().min(0).optional(),
  serviceId: z.string().nullable().optional(),
});

export const updateServiceFaqSchema = createServiceFaqSchema.partial();

export const createServiceInquirySchema = z.object({
  serviceId: z.string().nullable().optional(),
  serviceName: z.string().max(200).nullable().optional(),
  fullName: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).nullable().optional(),
  company: z.string().max(100).nullable().optional(),
  budget: z.string().max(50).nullable().optional(),
  message: z.string().min(1, "Message is required").max(5000),
});

export const updateServiceInquirySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "CONVERTED", "CLOSED", "LOST"]),
  notes: z.string().max(5000).nullable().optional(),
});

export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, "Must be a valid slug"),
  shortDescription: z.string().max(500).nullable().optional(),
  fullDescription: z.string().nullable().optional(),
  categoryId: z.string().min(1, "Category is required"),
  icon: z.string().max(50).nullable().optional(),
  featuredImage: z.string().max(500).nullable().optional(),
  galleryImages: z.array(z.string()).optional().default([]),
  features: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  deliverables: z.array(z.string()).optional().default([]),
  estimatedTimeline: z.string().max(100).nullable().optional(),
  startingPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().min(0).nullable().optional()
  ),
  featured: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  order: z.number().int().min(0).optional(),
  metaTitle: z.string().max(200).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  ogImage: z.string().max(500).nullable().optional(),
  canonicalUrl: z.string().max(500).nullable().optional(),
  testimonialIds: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  packages: z.array(createServicePackageSchema).optional().default([]),
  faqs: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    order: z.number().int().min(0).optional(),
  })).optional().default([]),
});

export const updateServiceSchema = createServiceSchema.partial();
