import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { ContactForm } from "@/components/contact/ContactForm";
import { CtaSection } from "@/components/shared/CtaSection";
import { ContactInfo } from "@/components/contact/ContactInfo";
import { CalendarContactCards } from "@/components/contact/CalendarContactCards";
import { ContactFaqList } from "@/components/contact/ContactFaqList";
import { getSiteSettings } from "@/lib/get-site-settings";
import { getPrisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const [settings, t] = await Promise.all([
    getSiteSettings(),
    getTranslations(),
  ]);
  return {
    title: t("contact.meta.title", { name: settings.siteName }),
    description: t("contact.meta.description", { name: settings.siteName }),
    openGraph: {
      title: t("contact.meta.ogTitle", { name: settings.siteName }),
      description: t("contact.meta.ogDescription", { name: settings.siteName }),
      url: `${settings.url}/contact`,
      images: [{ url: settings.ogImage, width: 1200, height: 630 }],
    },
  };
}

export default async function Contact() {
  const [settings, faqs] = await Promise.all([
    getSiteSettings(),
    getPrisma().contactFaq.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    }),
  ]);
  const t = await getTranslations();

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${settings.siteName}`,
    url: `${settings.url}/contact`,
    mainEntity: {
      "@type": "Person",
      name: settings.siteName,
      email: settings.email,
    },
  };

  return (
    <main className="pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageSchema) }}
      />

      <AnimatedSection>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {t("contact.title")}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground dark:text-zinc-400">
              {t("contact.heroDescription")}
            </p>
          </div>

          <div className="mx-auto mt-16 grid w-full gap-12 overflow-x-hidden lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <ContactForm />
            </div>

            <div className="space-y-6">
              <ContactInfo settings={settings} />
              <CalendarContactCards />
            </div>
          </div>

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <div className="mx-auto mt-20 max-w-3xl">
              <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-white">
                {t("contact.faq.title")}
              </h2>
              <div className="mt-10 space-y-4">
                <ContactFaqList faqs={faqs} />
              </div>
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Booking CTA */}
      <CtaSection
        title={t("home.cta.title")}
        description={t("home.cta.description")}
        primaryButton={{
          text: t("home.cta.primaryButton"),
          href: "/contact",
        }}
        secondaryButtons={[
          {
            text: t("portfolio.title"),
            href: "/portfolio",
          },
        ]}
      />
    </main>
  );
}
