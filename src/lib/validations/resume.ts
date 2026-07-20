import { z } from "zod";

export const socialLinkSchema = z.object({
  label: z.string(),
  url: z.string().url("Must be a valid URL"),
  icon: z.string().optional(),
});

export const resumeProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  professionalTitle: z.string().min(1, "Professional title is required"),
  photo: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  yearsOfExperience: z.number().nullable().optional(),
  summary: z.string().nullable().optional(),
  summaryTitle: z.string().nullable().optional(),
  specializations: z.array(z.string()).default([]),
  socialLinks: z.array(socialLinkSchema).default([]),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  website: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  template: z.enum(["modern", "corporate", "minimalist", "developer", "executive"]).default("modern"),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  ogImage: z.string().nullable().optional(),
  published: z.boolean().default(false),
  visibility: z.record(z.string(), z.boolean()).default({
    summary: true,
    experience: true,
    education: true,
    skills: true,
    certifications: true,
    awards: true,
    languages: true,
    references: true,
    featuredProjects: true,
  }),
});

export type ResumeProfileFormData = z.infer<typeof resumeProfileSchema>;

export const experienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  employmentType: z.enum(["Full-Time", "Part-Time", "Contract", "Freelance", "Internship"]).default("Full-Time"),
  location: z.string().nullable().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional(),
  current: z.boolean().default(false),
  responsibilities: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  order: z.number().default(0),
});

export type ExperienceFormData = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  order: z.number().default(0),
});

export type EducationFormData = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  category: z.string().default("Other"),
  proficiency: z.number().min(0).max(100).default(50),
  yearsOfExperience: z.number().nullable().optional(),
  order: z.number().default(0),
});

export type SkillFormData = z.infer<typeof skillSchema>;

export const certificationSchema = z.object({
  name: z.string().min(1, "Certification name is required"),
  organization: z.string().min(1, "Organization is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().nullable().optional(),
  credentialId: z.string().nullable().optional(),
  credentialUrl: z.string().url("Invalid URL").nullable().optional().or(z.literal("")),
  certificateFile: z.string().nullable().optional(),
  order: z.number().default(0),
});

export type CertificationFormData = z.infer<typeof certificationSchema>;

export const awardSchema = z.object({
  title: z.string().min(1, "Award title is required"),
  organization: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  order: z.number().default(0),
});

export type AwardFormData = z.infer<typeof awardSchema>;

export const languageSchema = z.object({
  language: z.string().min(1, "Language is required"),
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Fluent", "Native"]).default("Native"),
  order: z.number().default(0),
});

export type LanguageFormData = z.infer<typeof languageSchema>;

export const referenceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  position: z.string().nullable().optional(),
  organization: z.string().nullable().optional(),
  email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  phone: z.string().nullable().optional(),
  isPublic: z.boolean().default(true),
  order: z.number().default(0),
});

export type ReferenceFormData = z.infer<typeof referenceSchema>;
