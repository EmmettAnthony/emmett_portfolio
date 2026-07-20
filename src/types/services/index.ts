export type InquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "CONVERTED"
  | "CLOSED"
  | "LOST";

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  services?: Service[];
  _count?: { services: number };
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  price: number;
  features: string[];
  deliveryTime: string | null;
  revisions: number;
  supportDuration: string | null;
  isPopular: boolean;
  order: number;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceFAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  serviceId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInquiry {
  id: string;
  serviceId: string | null;
  service?: Service | null;
  serviceName: string | null;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  budget: string | null;
  message: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  fullDescription: string | null;
  categoryId: string;
  category?: ServiceCategory;
  icon: string | null;
  featuredImage: string | null;
  galleryImages: string[];
  features: string[];
  benefits: string[];
  technologies: string[];
  deliverables: string[];
  estimatedTimeline: string | null;
  startingPrice: number | null;
  featured: boolean;
  published: boolean;
  order: number;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  viewCount: number;
  testimonialIds: string[];
  tags: string[];
  packages?: ServicePackage[];
  faqs?: ServiceFAQ[];
  inquiries?: ServiceInquiry[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithRelations extends Service {
  category: ServiceCategory;
  packages: ServicePackage[];
  faqs: ServiceFAQ[];
}

export interface ServicesPageData {
  categories: (ServiceCategory & { services: Service[] })[];
  featuredServices: Service[];
  globalFaqs: ServiceFAQ[];
  testimonials: { id: string; name: string; content: string; rating: number; company: string | null }[];
}