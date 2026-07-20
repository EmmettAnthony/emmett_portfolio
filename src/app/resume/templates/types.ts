export interface ResumeData {
  fullName: string;
  professionalTitle: string;
  photo: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  summary: string | null;
  summaryTitle: string | null;
  specializations: string[];
  socialLinks: SocialLink[];
  email: string | null;
  phone: string | null;
  website: string | null;
  template: string;
}

export interface SocialLink {
  label: string;
  url: string;
  icon?: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: Date | string;
  endDate: Date | string | null;
  current: boolean;
  location: string | null;
  employmentType?: string;
  responsibilities: string[];
  achievements: string[];
  technologies: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  grade: string | null;
  description: string | null;
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  yearsOfExperience: number | null;
}

export interface Certification {
  id: string;
  name: string;
  organization: string;
  issueDate: Date | string;
  expiryDate: Date | string | null;
  credentialUrl: string | null;
  credentialId: string | null;
}

export interface ResumeAward {
  id: string;
  title: string;
  organization: string | null;
  date: Date | string | null;
  description: string | null;
}

export interface Language {
  id: string;
  language: string;
  proficiency: string;
}

export interface Reference {
  id: string;
  name: string;
  position: string | null;
  organization: string | null;
  email: string | null;
  phone: string | null;
}

export interface FeaturedProject {
  id: string;
  project: Project;
}

export interface Project {
  title: string;
  slug?: string;
  shortDescription: string | null;
  featuredImage?: string | null;
  category: { name: string } | null;
  technologies: { id: string; name: string }[];
  liveUrl?: string | null;
  githubUrl?: string | null;
}

export interface Testimonial {
  id: string;
  content: string;
  name: string;
  position: string | null;
  company: string | null;
}

export interface TemplateProps {
  resume: ResumeData;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
  certifications: Certification[];
  awards: ResumeAward[];
  languages: Language[];
  references: Reference[];
  featuredProjects: FeaturedProject[];
  testimonials?: Testimonial[];
  visibility: Record<string, boolean>;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
}

export function getProficiencyStars(level: string): number {
  const map: Record<string, number> = {
    Native: 5,
    Fluent: 4,
    Advanced: 3,
    Intermediate: 2,
    Beginner: 1,
  };
  return map[level] ?? 0;
}
