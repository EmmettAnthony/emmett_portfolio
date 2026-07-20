import { getSiteSettings } from "@/lib/get-site-settings";
import { getPrisma } from "@/lib/db";

export async function JsonLd() {
  const settings = await getSiteSettings();

  let alumniOf: Array<{ "@type": string; name: string }> = [];
  try {
    const prisma = getPrisma();
    const profile = await prisma.resumeProfile.findFirst({
      include: { education: true },
    });
    if (profile) {
      alumniOf = profile.education.map((edu) => ({
        "@type": "EducationalOrganization" as const,
        name: edu.institution,
      }));
    }
  } catch {}

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.siteName,
    givenName: settings.siteName.split(" ")[0],
    familyName: settings.siteName.split(" ")[1],
    description: settings.description,
    url: settings.url,
    sameAs: [
      settings.social.github,
      settings.social.linkedin,
      settings.social.twitter,
    ],
    email: settings.email,
    knowsAbout: settings.keywords,
    alumniOf,
    workLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: settings.address,
      },
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${settings.siteName}`,
    url: settings.url,
    description: settings.description,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([personSchema, websiteSchema]),
      }}
    />
  );
}
