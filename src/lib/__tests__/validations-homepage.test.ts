import { describe, it, expect } from "vitest";
import {
  homepageSchema,
  trustedLogoSchema,
  homepageStatisticSchema,
  homepageTechnologySchema,
} from "../validations/homepage";

describe("homepageSchema", () => {
  it("parses with minimal required data", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
    });
    expect(result.heroHeadline).toBe("Welcome");
    expect(result.statsEnabled).toBe(true);
    expect(result.projectsEnabled).toBe(true);
    expect(result.testimonialsEnabled).toBe(true);
    expect(result.blogEnabled).toBe(true);
    expect(result.certEnabled).toBe(true);
    expect(result.faqEnabled).toBe(true);
    expect(result.newsletterEnabled).toBe(true);
    expect(result.ctaEnabled).toBe(true);
    expect(result.published).toBe(true);
    expect(result.heroPrimaryCta).toBe("Hire Me");
    expect(result.heroPrimaryLink).toBe("/contact");
    expect(result.heroSecondaryCta).toBe("View Portfolio");
    expect(result.heroSecondaryLink).toBe("/portfolio");
    expect(result.layout).toBe("grid");
    expect(result.testimonialLayout).toBe("grid");
    expect(result.projectsCount).toBe(6);
    expect(result.testimonialsCount).toBe(6);
    expect(result.blogCount).toBe(3);
    expect(result.whyChooseItems).toEqual([]);
    expect(result.processSteps).toEqual([]);
    expect(result.faqs).toEqual([]);
  });

  it("rejects empty heroHeadline", () => {
    const result = homepageSchema.safeParse({ heroHeadline: "" });
    expect(result.success).toBe(false);
  });

  it("parses with nullable fields as null", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      heroHighlight: null,
      heroSubheadline: null,
      heroDescription: null,
      heroImage: null,
      heroBackground: null,
    });
    expect(result.heroHighlight).toBeNull();
    expect(result.heroSubheadline).toBeNull();
  });

  it("parses with whyChooseItems", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      whyChooseItems: [
        { title: "Quality", description: "We deliver quality" },
      ],
    });
    expect(result.whyChooseItems).toHaveLength(1);
    expect(result.whyChooseItems[0].title).toBe("Quality");
  });

  it("rejects whyChooseItem without title", () => {
    const result = homepageSchema.safeParse({
      heroHeadline: "Welcome",
      whyChooseItems: [{ description: "Something" }],
    });
    expect(result.success).toBe(false);
  });

  it("parses with processSteps", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      processSteps: [
        { step: 1, title: "Step 1", description: "Do something" },
      ],
    });
    expect(result.processSteps).toHaveLength(1);
    expect(result.processSteps[0].step).toBe(1);
  });

  it("parses with faqs", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      faqs: [{ question: "Q?", answer: "A!" }],
    });
    expect(result.faqs).toHaveLength(1);
  });

  it("rejects faq without question", () => {
    const result = homepageSchema.safeParse({
      heroHeadline: "Welcome",
      faqs: [{ answer: "A!" }],
    });
    expect(result.success).toBe(false);
  });

  it("parses with all layout options", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      layout: "carousel",
      testimonialLayout: "slider",
    });
    expect(result.layout).toBe("carousel");
    expect(result.testimonialLayout).toBe("slider");
  });

  it("rejects invalid layout", () => {
    const result = homepageSchema.safeParse({
      heroHeadline: "Welcome",
      layout: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("parses with SEO fields", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      metaTitle: "Homepage",
      metaDescription: "Description",
      metaKeywords: "keyword1, keyword2",
      canonicalUrl: "https://example.com",
      ogImage: "https://example.com/og.jpg",
    });
    expect(result.metaTitle).toBe("Homepage");
    expect(result.metaDescription).toBe("Description");
    expect(result.canonicalUrl).toBe("https://example.com");
    expect(result.ogImage).toBe("https://example.com/og.jpg");
  });

  it("parses with CTA fields", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      ctaTitle: "Get Started",
      ctaDescription: "Start now",
      ctaBackground: "blue",
      ctaPrimaryButton: "Contact Us",
      ctaPrimaryLink: "/contact",
      ctaSecondaryButton: "Learn More",
      ctaSecondaryLink: "/about",
      ctaEnabled: false,
    });
    expect(result.ctaPrimaryButton).toBe("Contact Us");
    expect(result.ctaSecondaryButton).toBe("Learn More");
    expect(result.ctaEnabled).toBe(false);
  });

  it("parses with all newsletters fields", () => {
    const result = homepageSchema.parse({
      heroHeadline: "Welcome",
      newsletterTitle: "Subscribe",
      newsletterDesc: "Get updates",
      newsletterEnabled: false,
    });
    expect(result.newsletterTitle).toBe("Subscribe");
    expect(result.newsletterEnabled).toBe(false);
  });

  it("parses with CTA defaults", () => {
    const result = homepageSchema.parse({ heroHeadline: "Welcome" });
    expect(result.ctaPrimaryButton).toBe("Get in Touch");
    expect(result.ctaPrimaryLink).toBe("/contact");
  });
});

describe("trustedLogoSchema", () => {
  it("parses valid logo", () => {
    const result = trustedLogoSchema.parse({
      name: "Company",
      logoUrl: "https://example.com/logo.png",
    });
    expect(result.name).toBe("Company");
    expect(result.logoUrl).toBe("https://example.com/logo.png");
    expect(result.enabled).toBe(true);
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = trustedLogoSchema.safeParse({
      name: "",
      logoUrl: "https://example.com/logo.png",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty logoUrl", () => {
    const result = trustedLogoSchema.safeParse({
      name: "Company",
      logoUrl: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = trustedLogoSchema.parse({
      name: "Company",
      logoUrl: "https://example.com/logo.png",
      website: "https://example.com",
      enabled: false,
      order: 5,
    });
    expect(result.website).toBe("https://example.com");
    expect(result.enabled).toBe(false);
    expect(result.order).toBe(5);
  });
});

describe("homepageStatisticSchema", () => {
  it("parses valid statistic", () => {
    const result = homepageStatisticSchema.parse({
      title: "Projects",
      value: "100+",
    });
    expect(result.title).toBe("Projects");
    expect(result.value).toBe("100+");
    expect(result.order).toBe(0);
  });

  it("rejects empty title", () => {
    const result = homepageStatisticSchema.safeParse({
      title: "",
      value: "100+",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty value", () => {
    const result = homepageStatisticSchema.safeParse({
      title: "Projects",
      value: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = homepageStatisticSchema.parse({
      title: "Projects",
      value: "100+",
      icon: "briefcase",
      order: 2,
    });
    expect(result.icon).toBe("briefcase");
    expect(result.order).toBe(2);
  });
});

describe("homepageTechnologySchema", () => {
  it("parses valid technology", () => {
    const result = homepageTechnologySchema.parse({
      name: "React",
      category: "Frontend",
    });
    expect(result.name).toBe("React");
    expect(result.category).toBe("Frontend");
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = homepageTechnologySchema.safeParse({
      name: "",
      category: "Frontend",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = homepageTechnologySchema.safeParse({
      name: "React",
      category: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = homepageTechnologySchema.parse({
      name: "React",
      category: "Frontend",
      logo: "https://example.com/react.png",
      experienceLevel: "Advanced",
      order: 1,
    });
    expect(result.logo).toBe("https://example.com/react.png");
    expect(result.experienceLevel).toBe("Advanced");
    expect(result.order).toBe(1);
  });
});
