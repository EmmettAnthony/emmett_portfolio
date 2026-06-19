import { siteConfig } from "@/data/site-config";
import resume from "@/data/resume.json";

export function JsonLd() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.name,
    givenName: siteConfig.name.split(" ")[0],
    familyName: siteConfig.name.split(" ")[1],
    jobTitle: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.linkedin,
      siteConfig.links.twitter,
    ],
    email: siteConfig.links.email,
    knowsAbout: siteConfig.keywords,
    alumniOf: resume.education.map((edu) => ({
      "@type": "EducationalOrganization",
      name: edu.institution,
    })),
    workLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: siteConfig.location,
      },
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${siteConfig.name} | ${siteConfig.title}`,
    url: siteConfig.url,
    description: siteConfig.description,
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
