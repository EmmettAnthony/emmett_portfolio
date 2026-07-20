import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ExternalLink,
  Play,
  Star,
  Calendar,
  Clock,
  Users,
  Building2,
  Target,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { GithubIcon } from "@/components/ui/SocialIcons";
import { getSiteSettings } from "@/lib/get-site-settings";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import { ContactCta } from "@/components/services/ContactCta";
import { GalleryWithLightbox } from "./GalleryWithLightbox";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Technology {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
}

interface ProjectMetric {
  id: string;
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
}

interface CaseStudy {
  id: string;
  problemStatement?: string;
  businessProblem?: string;
  requirements?: string;
  projectGoals?: string;
  research?: string;
  solution?: string;
  developmentProcess?: string;
  results?: string;
  challenges?: string;
  clientBackground?: string;
  objectives?: string;
  lessonsLearned?: string;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  fullDescription?: string;
  projectSummary?: string;
  clientName?: string;
  clientIndustry?: string;
  categoryId?: string;
  category?: Category;
  technologies: Technology[];
  featuredImage?: string;
  thumbnailImage?: string;
  galleryImages: string[];
  videoDemo?: string;
  projectLogo?: string;
  startDate?: string;
  completionDate?: string;
  projectDuration?: string;
  teamSize?: number;
  status: string;
  featured: boolean;
  published: boolean;
  viewCount: number;
  liveUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  tags: string[];
  testimonialIds: string[];
  createdAt: string;
  caseStudy?: CaseStudy;
  metrics: ProjectMetric[];
}

interface RelatedProject {
  id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  featuredImage?: string;
  thumbnailImage?: string;
  category?: Category;
  technologies: Technology[];
}

interface Testimonial {
  id: string;
  name: string;
  jobTitle?: string;
  company?: string;
  photo?: string;
  title?: string;
  content: string;
  rating: number;
}

async function getProject(slug: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/portfolio/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function StatusBadge({ status, t: _t }: { status: string; t?: (key: string) => string }) {
  const colors: Record<string, string> = {
    COMPLETED:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    IN_PROGRESS:
      "bg-badge-info-bg text-badge-info-text",
    DRAFT: "bg-zinc-100 text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400",
    ARCHIVED:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        colors[status] || colors.DRAFT
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "COMPLETED"
            ? "bg-green-500"
            : status === "IN_PROGRESS"
              ? "bg-blue-500"
              : "bg-zinc-400"
        }`}
      />
      {_t ? _t(status) : status.replace(/_/g, " ")}
    </span>
  );
}

function MetricCard({
  label,
  value,
  prefix,
  suffix,
}: ProjectMetric) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
        {prefix || ""}
        {value}
        {suffix || ""}
      </p>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProject(slug);
  if (!data) return {};

  const project: Project = data.project;
  const settings = await getSiteSettings();

  return {
    title: project.metaTitle || `${project.title} | ${settings.siteName}`,
    description:
      project.metaDescription ||
      project.shortDescription ||
      `${project.title} portfolio project by ${settings.siteName}`,
    openGraph: {
      title: project.metaTitle || project.title,
      description:
        project.metaDescription ||
        project.shortDescription ||
        undefined,
      url: project.canonicalUrl || `${settings.url}/portfolio/${slug}`,
      images: project.ogImage || project.featuredImage || undefined,
    },
    alternates: {
      canonical: project.canonicalUrl || `${settings.url}/portfolio/${slug}`,
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const t = await getTranslations("portfolio.detail");
  const locale = await getLocale();
  const { slug } = await params;
  const data = await getProject(slug);

  if (!data) {
    notFound();
  }

  const project: Project = data.project;
  const relatedProjects: RelatedProject[] = data.relatedProjects || [];
  const testimonials: Testimonial[] = data.testimonials || [];
  const settings = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.shortDescription || project.fullDescription,
    url: `${settings.url}/portfolio/${slug}`,
    image: project.featuredImage,
    author: {
      "@type": "Person",
      name: settings.siteName,
    },
    keywords: (project.tags as string[]).join(", "),
    dateCreated: project.startDate || project.createdAt,
    datePublished: project.completionDate || undefined,
    status: project.status,
  };

  const hasCaseStudy = project.caseStudy;
  const hasMetrics =
    project.metrics && project.metrics.length > 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back Navigation */}
      <div className="mx-auto max-w-6xl px-4 pt-24 sm:px-6 lg:px-8">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToPortfolio")}
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent dark:from-blue-500/10" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <AnimateOnScroll direction="left">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {project.category?.name || t("uncategorized")}
                </span>
                    <StatusBadge status={project.status} t={t} />
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-4xl lg:text-5xl">
                {project.title}
              </h1>

              {project.shortDescription && (
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {project.shortDescription}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-500">
                {project.clientName && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    {project.clientName}
                  </span>
                )}
                {project.projectDuration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {project.projectDuration}
                  </span>
                )}
                {project.teamSize && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {t("teamOf")} {project.teamSize}
                  </span>
                )}
                {project.completionDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.completionDate).toLocaleDateString(
                      locale,
                      { year: "numeric", month: "long" }
                    )}
                  </span>
                )}
              </div>

              {/* Technologies */}
              <div className="mt-6 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span
                    key={tech.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                    style={
                      tech.color
                        ? { borderColor: tech.color, color: tech.color }
                        : undefined
                    }
                  >
                    {tech.name}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap gap-3">
                {project.liveUrl && (
                  <Link
                    href={project.liveUrl}
                    target="_blank"
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-semibold text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t("liveDemo")}
                  </Link>
                )}
                {project.githubUrl && (
                  <Link
                    href={project.githubUrl}
                    target="_blank"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                  >
                    <GithubIcon className="h-4 w-4" />
                    {t("github")}
                  </Link>
                )}
                {project.demoUrl && (
                  <Link
                    href={project.demoUrl}
                    target="_blank"
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-zinc-300 bg-white px-6 text-sm font-semibold text-zinc-900 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
                  >
                    <Play className="h-4 w-4" />
                    {t("viewDemo")}
                  </Link>
                )}
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll direction="right" className="relative">
              {project.featuredImage && (
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100 shadow-xl dark:bg-zinc-800">
                  <Image
                    src={project.featuredImage}
                    alt={project.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    unoptimized
                  />
                </div>
              )}
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {t("projectOverview")}
                </h2>
                {project.projectSummary && (
                  <p className="mt-4 leading-relaxed text-muted-foreground dark:text-zinc-400">
                    {project.projectSummary}
                  </p>
                )}
                {project.fullDescription && !project.projectSummary && (
                  <p className="mt-4 leading-relaxed text-muted-foreground dark:text-zinc-400">
                    {project.fullDescription}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {project.clientName && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      {t("client")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                      {project.clientName}
                    </p>
                    {project.clientIndustry && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-500">
                        {project.clientIndustry}
                      </p>
                    )}
                  </div>
                )}
                {project.projectDuration && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      {t("duration")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                      {project.projectDuration}
                    </p>
                  </div>
                )}
                {project.teamSize && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500">
                      {t("teamSize")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                      {project.teamSize} {t("people")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Challenge Section */}
      {hasCaseStudy &&
        (project.caseStudy!.problemStatement ||
          project.caseStudy!.businessProblem ||
          project.caseStudy!.requirements) && (
          <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <AnimateOnScroll>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                    <Target className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {t("theChallenge")}
                  </h2>
                </div>
              </AnimateOnScroll>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {(project.caseStudy!.problemStatement ||
                  project.caseStudy!.businessProblem) && (
                  <AnimateOnScroll delay={0.1}>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {t("problemStatement")}
                      </h3>
                      <p className="mt-3 leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {project.caseStudy!.problemStatement ||
                          project.caseStudy!.businessProblem}
                      </p>
                    </div>
                  </AnimateOnScroll>
                )}
                {project.caseStudy!.requirements && (
                  <AnimateOnScroll delay={0.2}>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {t("requirements")}
                      </h3>
                      <p className="mt-3 leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {project.caseStudy!.requirements}
                      </p>
                    </div>
                  </AnimateOnScroll>
                )}
              </div>
            </div>
          </section>
        )}

      {/* Development Process */}
      {hasCaseStudy &&
        (project.caseStudy!.projectGoals ||
          project.caseStudy!.research ||
          project.caseStudy!.solution ||
          project.caseStudy!.developmentProcess) && (
          <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <AnimateOnScroll>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    {t("developmentProcess")}
                  </h2>
                </div>
              </AnimateOnScroll>

              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {project.caseStudy!.projectGoals && (
                  <AnimateOnScroll delay={0.1}>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {t("projectGoals")}
                      </h3>
                      <p className="mt-3 leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {project.caseStudy!.projectGoals}
                      </p>
                    </div>
                  </AnimateOnScroll>
                )}
                {project.caseStudy!.research && (
                  <AnimateOnScroll delay={0.15}>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {t("research")}
                      </h3>
                      <p className="mt-3 leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {project.caseStudy!.research}
                      </p>
                    </div>
                  </AnimateOnScroll>
                )}
                {project.caseStudy!.solution && (
                  <AnimateOnScroll delay={0.2}>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {t("solution")}
                      </h3>
                      <p className="mt-3 leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {project.caseStudy!.solution}
                      </p>
                    </div>
                  </AnimateOnScroll>
                )}
                {project.caseStudy!.developmentProcess && (
                  <AnimateOnScroll delay={0.25}>
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {t("development")}
                      </h3>
                      <p className="mt-3 leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {project.caseStudy!.developmentProcess}
                      </p>
                    </div>
                  </AnimateOnScroll>
                )}
              </div>
            </div>
          </section>
        )}

      {/* Results Section */}
      {(hasMetrics || hasCaseStudy?.results) && (
        <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {t("results")}
                </h2>
              </div>
            </AnimateOnScroll>

            {hasMetrics && (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {project.metrics!.map((metric, index) => (
                  <AnimateOnScroll key={metric.id} delay={index * 0.05}>
                    <MetricCard {...metric} />
                  </AnimateOnScroll>
                ))}
              </div>
            )}

            {hasCaseStudy?.results && (
              <AnimateOnScroll delay={0.2}>
                <div className="mt-8 rounded-2xl border border-zinc-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 dark:border-zinc-800 dark:from-green-950/20 dark:to-emerald-950/20">
                  <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {project.caseStudy!.results}
                  </p>
                </div>
              </AnimateOnScroll>
            )}
          </div>
        </section>
      )}

      {/* Gallery */}
      {project.galleryImages && project.galleryImages.length > 0 && (
        <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {t("gallery")}
              </h2>
            </AnimateOnScroll>

            <GalleryWithLightbox
              images={project.galleryImages as string[]}
              projectTitle={project.title}
            />
          </div>
        </section>
      )}

      {/* Video Demo */}
      {project.videoDemo && (
        <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {t("videoDemo")}
              </h2>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.1}>
              <div className="mt-8 aspect-video overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                <iframe
                  src={project.videoDemo}
                  title={t("demoVideoTitle", { title: project.title })}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </AnimateOnScroll>
          </div>
        </section>
      )}

      {/* Technologies Used */}
      <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {t("technologiesUsed")}
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.1}>
            <div className="mt-8 flex flex-wrap gap-3">
              {project.technologies.length > 0 ? (
                project.technologies.map((tech) => (
                  <div
                    key={tech.id}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: tech.color || "#3b82f6",
                      }}
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {tech.name}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">
                  {t("noTechInfo")}
                </p>
              )}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {t("relatedProjects")}
              </h2>
            </AnimateOnScroll>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedProjects.map((related, index) => (
                <AnimateOnScroll key={related.id} delay={index * 0.05}>
                  <Link href={`/portfolio/${related.slug}`}>
                    <div className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        {(related.featuredImage ||
                          related.thumbnailImage) && (
                          <Image
                            src={
                              related.featuredImage ||
                              related.thumbnailImage!
                            }
                            alt={related.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            unoptimized
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-surface opacity-0 transition-opacity group-hover:opacity-100">
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900">
                            {t("viewProject")}
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>
                      <div className="p-5">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {related.category?.name || t("uncategorized")}
                        </span>
                        <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-white">
                          {related.title}
                        </h3>
                        {related.shortDescription && (
                          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 dark:text-zinc-400">
                            {related.shortDescription}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-t border-zinc-100 py-16 dark:border-zinc-800 md:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <AnimateOnScroll>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                {t("clientTestimonials")}
              </h2>
            </AnimateOnScroll>

            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <AnimateOnScroll key={testimonial.id} delay={index * 0.1}>
                  <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-4 flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-zinc-300 dark:text-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    {testimonial.title && (
                      <h4 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">
                        {testimonial.title}
                      </h4>
                    )}
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                      &ldquo;{testimonial.content}&rdquo;
                    </p>
                    <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {testimonial.name}
                        </p>
                        {(testimonial.jobTitle || testimonial.company) && (
                          <p className="text-xs text-zinc-500">
                            {[testimonial.jobTitle, testimonial.company]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <ContactCta />
    </>
  );
}
