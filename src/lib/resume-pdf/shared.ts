export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export interface PDFResumeData {
  fullName: string;
  professionalTitle: string;
  location: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  summary: string | null;
  template: string;
  visibility: Record<string, boolean>;
}

export interface PDFExperience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: Date | string;
  endDate: Date | string | null;
  current: boolean;
  responsibilities: string[];
  technologies: string[];
}

export interface PDFEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startDate: Date | string;
  endDate: Date | string | null;
  grade: string | null;
}

export interface PDFSkill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
}

export interface PDFCertification {
  id: string;
  name: string;
  organization: string;
  issueDate: Date | string;
}

export interface PDFAward {
  id: string;
  title: string;
  organization: string;
  date: Date | string | null;
}

export interface PDFLanguage {
  id: string;
  language: string;
  proficiency: string;
}

export interface PDFTemplateProps {
  resume: PDFResumeData;
  experiences: PDFExperience[];
  education: PDFEducation[];
  skills: PDFSkill[];
  certifications: PDFCertification[];
  awards: PDFAward[];
  languages: PDFLanguage[];
}
