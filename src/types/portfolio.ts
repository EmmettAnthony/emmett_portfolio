export interface PortfolioCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  _count?: { projects: number };
  projects?: PortfolioProject[];
  createdAt: string;
  updatedAt: string;
}

export interface Technology {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMetric {
  id: string;
  projectId: string;
  label: string;
  value: string;
  prefix: string | null;
  suffix: string | null;
  order: number;
}

export interface CaseStudy {
  id: string;
  projectId: string;
  clientBackground: string | null;
  businessProblem: string | null;
  objectives: string | null;
  research: string | null;
  solution: string | null;
  developmentProcess: string | null;
  results: string | null;
  lessonsLearned: string | null;
  challenges: string | null;
  requirements: string | null;
  projectGoals: string | null;
  problemStatement: string | null;
}

export interface PortfolioProject {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  projectSummary: string | null;
  clientName: string | null;
  clientIndustry: string | null;
  categoryId: string | null;
  category: PortfolioCategory | null;
  technologies: Technology[];
  featuredImage: string | null;
  thumbnailImage: string | null;
  galleryImages: string[];
  videoDemo: string | null;
  projectLogo: string | null;
  startDate: string | null;
  completionDate: string | null;
  projectDuration: string | null;
  teamSize: number | null;
  status: string;
  featured: boolean;
  published: boolean;
  order: number;
  viewCount: number;
  liveUrl: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  caseStudyUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  tags: string[];
  awards: string[];
  testimonialIds: string[];
  createdAt: string;
  updatedAt: string;
  caseStudy: CaseStudy | null;
  metrics: ProjectMetric[];
}

export interface PortfolioStats {
  total: number;
  published: number;
  draft: number;
  inProgress: number;
  completed: number;
  totalViews: number;
  featured: number;
}
