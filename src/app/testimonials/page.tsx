import { getPrisma } from "@/lib/db";
import { TestimonialCarousel } from "@/components/testimonials/testimonial-carousel";
import { TestimonialGrid } from "@/components/testimonials/testimonial-grid";
import { TestimonialMasonry } from "@/components/testimonials/testimonial-masonry";
import { TestimonialSingleFeatured } from "@/components/testimonials/testimonial-single-featured";
import { getTestimonialPageSettings } from "@/lib/helpers/testimonial-settings";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Star, MessageSquareQuote, ChevronRight } from "lucide-react";
import { CtaSection } from "@/components/shared/CtaSection";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("testimonials.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

async function getTestimonials() {
  const prisma = getPrisma();
  const testimonials = await prisma.testimonial.findMany({
    where: { status: "APPROVED", archived: false },
    orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
  });
  return testimonials;
}

export default async function TestimonialsPage() {
  const t = await getTranslations("testimonials");
  const testimonials = await getTestimonials();
  const settings = await getTestimonialPageSettings();
  const featured = testimonials.filter((t) => t.featured);
  const single = featured[0] || testimonials[0];

  const avgRating = testimonials.length > 0
    ? (testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length).toFixed(1)
    : "0";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Emmett Anthony - Software Development Services",
    review: testimonials.map((t) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
      author: { "@type": "Person", name: t.name },
      reviewBody: t.content,
      datePublished: t.createdAt,
      itemReviewed: { "@type": "Service", name: t.projectName || "Software Development Services" },
    })),
    aggregateRating: testimonials.length > 0 ? {
      "@type": "AggregateRating",
      ratingValue: avgRating,
      reviewCount: testimonials.length,
      bestRating: 5,
    } : undefined,
  };

  const showSingle = settings.pageShowSingleFeatured !== false;
  const showCarousel = settings.pageShowCarousel !== false;
  const showGrid = settings.pageShowGrid !== false;
  const showMasonry = settings.pageShowMasonry !== false;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero — Amber Glow */}
      <section className="relative overflow-hidden bg-zinc-950 px-4 py-24 sm:py-32">
        <div className="hero-glow-amber" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <MessageSquareQuote className="h-7 w-7 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t("whatClientsSay")}
          </h1>
          <p className="mt-4 text-lg text-zinc-400">
            {t("realFeedback")}
          </p>
          {testimonials.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{testimonials.length}</p>
                <p className="text-zinc-400">{t("testimonials")}</p>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{avgRating}</p>
                <p className="text-zinc-400">{t("avgRating")}</p>
              </div>
              <div className="h-10 w-px bg-zinc-800" />
              <div className="text-center">
                <div className="flex justify-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-4 w-4", i < Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground")} />
                  ))}
                </div>
                <p className="text-zinc-400">{t("rating")}</p>
              </div>
            </div>
          )}
        </div>
      </section>

    <section className="bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {testimonials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquareQuote className="mb-4 h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{t("noTestimonials")}</h2>
            <p className="mt-2 text-zinc-500">{t("beFirst")}</p>
            <Link href="/testimonials/submit"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
              {t("submitTestimonial")} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            {showSingle && single && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <TestimonialSingleFeatured testimonial={single} />
              </div>
            )}

            {showCarousel && testimonials.length > 0 && (
              <section className="mt-20">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("clientStories")}</h2>
                  <p className="mt-2 text-zinc-500">{t("clientStoriesDesc")}</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <TestimonialCarousel testimonials={testimonials} />
                </div>
              </section>
            )}

            {showGrid && testimonials.length > 0 && (
              <section className="mt-20">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("allReviews")}</h2>
                  <p className="mt-2 text-zinc-500">{t("allReviewsDesc")}</p>
                </div>
                <TestimonialGrid testimonials={testimonials} columns={settings.pageGridColumns} />
              </section>
            )}

            {showMasonry && testimonials.length > 0 && (
              <section className="mt-20">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("testimonialWall")}</h2>
                  <p className="mt-2 text-zinc-500">{t("testimonialWallDesc")}</p>
                </div>
                <TestimonialMasonry testimonials={testimonials} />
              </section>
            )}

            {/* CTA */}
            <CtaSection
              title={t("shareExperience")}
              description={t("shareExperienceDesc")}
              overlay="amber"
              showDecoration={false}
              primaryButton={{
                text: t("submitButton"),
                href: "/testimonials/submit",
                className:
                  "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:from-amber-400 hover:to-orange-500 hover:shadow-amber-500/25",
              }}
            />
          </>
        )}
      </div>
    </section>
    </>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
