import { z } from "zod";

export const portfolioCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
});

export const technologySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  category: z.string().optional(),
});

export const projectMetricSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required"),
  value: z.string().min(1, "Value is required"),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  order: z.number().optional(),
});

export const portfolioProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().optional(),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  projectSummary: z.string().optional(),
  clientName: z.string().optional(),
  clientIndustry: z.string().optional(),
  categoryId: z.string().optional(),
  technologyIds: z.array(z.string()).optional(),
  featuredImage: z.string().optional(),
  thumbnailImage: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  videoDemo: z.string().optional(),
  projectLogo: z.string().optional(),
  startDate: z.string().optional(),
  completionDate: z.string().optional(),
  projectDuration: z.string().optional(),
  teamSize: z.number().optional(),
  status: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  order: z.number().optional(),
  liveUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  demoUrl: z.string().optional(),
  caseStudyUrl: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImage: z.string().optional(),
  canonicalUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
  testimonialIds: z.array(z.string()).optional(),
  metrics: z.array(projectMetricSchema).optional(),
});

export const caseStudySchema = z.object({
  clientBackground: z.string().optional(),
  businessProblem: z.string().optional(),
  objectives: z.string().optional(),
  research: z.string().optional(),
  solution: z.string().optional(),
  developmentProcess: z.string().optional(),
  results: z.string().optional(),
  lessonsLearned: z.string().optional(),
  challenges: z.string().optional(),
  requirements: z.string().optional(),
  projectGoals: z.string().optional(),
  problemStatement: z.string().optional(),
});

export type PortfolioProjectForm = z.infer<typeof portfolioProjectSchema>;
export type PortfolioCategoryForm = z.infer<typeof portfolioCategorySchema>;
export type TechnologyForm = z.infer<typeof technologySchema>;
export type CaseStudyForm = z.infer<typeof caseStudySchema>;
