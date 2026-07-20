import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  DollarSign,
  ArrowLeft,
  FileText,
  Star as StarIcon,
} from "lucide-react";
import { ComparisonTable } from "@/components/services/ComparisonTable";
import { ServiceFaqSection } from "@/components/services/ServiceFaqSection";
import { ServiceInquiryForm } from "@/components/services/ServiceInquiryForm";
import {
  RelatedServices
} from "@/components/services/RelatedServices";
import { ContactCta } from "@/components/services/ContactCta";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import type { RelatedService } from "@/components/services/RelatedServices";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getService(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/services/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getRelatedServices(
  categoryId: string,
  currentSlug: string
): Promise<RelatedService[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/services`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    const categories: Array<{
      id: string;
      services: RelatedService[];
    }> = data.categories || [];
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return [];
    return category.services
      .filter((s) => s.slug !== currentSlug)
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getService(slug);
  if (!data) return {};

  const service = data.service;
  return {
    title: service.metaTitle || `${service.title} | Emmett Anthony`,
    description: service.metaDescription || service.shortDescription || "",
    openGraph: {
      title: service.metaTitle || service.title,
      description: service.metaDescription || service.shortDescription || "",
      images: service.ogImage
        ? [{ url: service.ogImage }]
        : service.featuredImage
          ? [{ url: service.featuredImage }]
          : undefined,
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const t = await getTranslations("services.detail");
  const { slug } = await params;
  const data = await getService(slug);

  if (!data) {
    notFound();
  }



  const features: string[] = Array.isArray(service.features)
    ? service.features
    : [];

  const benefits: string[] = Array.isArray(service.benefits)
    ? service.benefits
    : [];

  const technologies: string[] = Array.isArray(service.technologies)
    ? service.technologies
    : [];

  const deliverables: string[] = Array.isArray(service.deliverables)
    ? service.deliverables
    : [];

  const packages: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    features: string[];
    deliveryTime: string | null;
    revisions: number | null;
    isPopular: boolean;
    order: number;
  }> = service.packages || [];

  const faqs: Array<{
    id: string;
    question: string;
    answer: string;
    order: number;
  }> = service.faqs || [];

  const related = await getRelatedServices(service.categoryId, slug);

  // Load testimonials filtered by service.testimonialIds

  const serviceTestimonials: Array<{ id: string; name: string; content: string; rating: number; company: string | null; photo: string | null }> = data.testimonials || [];

  // Compute average rating from testimonials
  const avgRating = serviceTestimonials.length > 0
    ? Math.round(serviceTestimonials.reduce((sum: number, t: { rating: number }) => sum + t.rating, 0) / serviceTestimonials.length * 10) / 10
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.shortDescription,
    provider: { "@type": "Person", name: "Emmett Anthony" },
    offers: service.startingPrice
      ? {
          "@type": "Offer",
          price: service.startingPrice,
          priceCurrency: "USD",
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="pt-24">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Link
            href="/services"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("allServices")}
          </Link>

          <AnimateOnScroll>
            <div className="grid gap-12 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                  {service.title}
                </h1>
                {service.shortDescription && (
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
                    {service.shortDescription}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  {service.estimatedTimeline && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400">
                      <Clock className="h-4 w-4" />
                      {service.estimatedTimeline}
                    </span>
                  )}
                  {service.startingPrice && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <DollarSign className="h-4 w-4" />
                      {t("startingAt")} ${service.startingPrice}
                    </span>
                  )}
                  {avgRating && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      <StarIcon className="h-4 w-4 fill-amber-500" />
                      {avgRating} ({serviceTestimonials.length} {t("reviews")})
                    </span>
                  )}
                </div>
                <div className="mt-4 flex gap-3">
                  <a
                    href={`/api/services/${slug}/brochure`}
                    download
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-muted-foreground dark:hover:bg-zinc-800"
                  >
                    <FileText className="h-4 w-4" />
                    {t("downloadBrochure")}
                  </a>
                </div>
              </div>
              {service.featuredImage && (
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 lg:col-span-2 dark:bg-zinc-800">
                  <Image
                    src={service.featuredImage}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    priority
                  />
                </div>
              )}
            </div>
          </AnimateOnScroll>

          {service.fullDescription && (
            <AnimateOnScroll className="mt-16">
              <div className="prose prose-zinc max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: service.fullDescription }} />
              </div>
            </AnimateOnScroll>
          )}

          {features.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("features")}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {features.map((feature: string) => (
                  <div
                    key={feature}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      ✓
                    </span>
                    <span className="text-sm text-muted-foreground dark:text-zinc-400">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          )}

          {benefits.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("benefits")}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {benefits.map((benefit: string) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-600 dark:bg-green-900/30 dark:text-green-400">
                      +
                    </span>
                    <span className="text-sm text-muted-foreground dark:text-zinc-400">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          )}

          {technologies.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("technologiesUsed")}
              </h2>
              <div className="mt-6 flex flex-wrap gap-3">
                {technologies.map((tech: string) => (
                  <span
                    key={tech}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-muted-foreground"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </AnimateOnScroll>
          )}

          {deliverables.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("deliverables")}
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {deliverables.map((item: string) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <span className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                      •
                    </span>
                    <span className="text-sm text-muted-foreground dark:text-zinc-400">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          )}

          {packages.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("pricingPackages")}
              </h2>
              <div className="mt-6">
                <ComparisonTable packages={packages} />
              </div>
            </AnimateOnScroll>
          )}

          {faqs.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <ServiceFaqSection faqs={faqs} />
            </AnimateOnScroll>
          )}

          {serviceTestimonials.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("clientTestimonials")}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {serviceTestimonials.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <StarIcon key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">&ldquo;{t.content}&rdquo;</p>
                    <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      {t.photo ? (
                        <Image src={t.photo} alt={t.name} width={36} height={36} className="rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t.name.charAt(0)}</div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">{t.name}</p>
                        {t.company && <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.company}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          )}

          {related.length > 0 && (
            <AnimateOnScroll className="mt-16">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {t("relatedServices")}
              </h2>
              <div className="mt-6">
                <RelatedServices services={related} />
              </div>
            </AnimateOnScroll>
          )}

          <div className="mt-16">
            <div className="grid gap-12 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <ContactCta />
              </div>
              <div className="lg:col-span-2">
                <ServiceInquiryForm
                  serviceId={service.id}
                  serviceName={service.title}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
