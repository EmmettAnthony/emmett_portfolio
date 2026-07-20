import { describe, it, expect } from "vitest";
import {
  aboutPageSchema,
  aboutStatisticSchema,
  aboutTechnologySchema,
  whyWorkWithMeItemSchema,
  workProcessStepSchema,
  personalInterestSchema,
  socialLinkItemSchema,
  faqItemSchema,
} from "../validations/about";

describe("aboutPageSchema", () => {
  it("parses with minimal required fields", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Developer",
    });
    expect(result.fullName).toBe("Emmett");
    expect(result.professionalTitle).toBe("Developer");
    expect(result.published).toBe(false);
    expect(result.socialLinks).toEqual([]);
    expect(result.faqs).toEqual([]);
    expect(result.whyWorkWithMe).toEqual([]);
    expect(result.workProcess).toEqual([]);
    expect(result.personalInterests).toEqual([]);
  });

  it("rejects empty fullName", () => {
    const result = aboutPageSchema.safeParse({
      fullName: "",
      professionalTitle: "Dev",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty professionalTitle", () => {
    const result = aboutPageSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "",
    });
    expect(result.success).toBe(false);
  });

  it("parses with nullable fields as null", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Developer",
      shortIntro: null,
      photo: null,
      resumeUrl: null,
    });
    expect(result.shortIntro).toBeNull();
    expect(result.photo).toBeNull();
  });

  it("parses with whyWorkWithMe items", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Developer",
      whyWorkWithMe: [
        { title: "Quality", description: "High quality work" },
      ],
    });
    expect(result.whyWorkWithMe).toHaveLength(1);
    expect(result.whyWorkWithMe[0].title).toBe("Quality");
  });

  it("rejects whyWorkWithMe without title", () => {
    const result = aboutPageSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      whyWorkWithMe: [{ description: "Something" }],
    });
    expect(result.success).toBe(false);
  });

  it("parses with workProcess steps", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      workProcess: [
        { step: 1, title: "Analyze", description: "Analyze needs" },
      ],
    });
    expect(result.workProcess).toHaveLength(1);
  });

  it("parses with personalInterests", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      personalInterests: [
        { name: "Photography", description: "Love taking photos" },
      ],
    });
    expect(result.personalInterests).toHaveLength(1);
  });

  it("parses with socialLinks", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      socialLinks: [
        { platform: "GitHub", url: "https://github.com/emmett" },
      ],
    });
    expect(result.socialLinks).toHaveLength(1);
    expect(result.socialLinks[0].platform).toBe("GitHub");
    expect(result.socialLinks[0].enabled).toBe(true);
  });

  it("rejects socialLink without valid url", () => {
    const result = aboutPageSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      socialLinks: [{ platform: "GitHub", url: "not-url" }],
    });
    expect(result.success).toBe(false);
  });

  it("parses with faqs", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      faqs: [{ question: "Q?", answer: "A!" }],
    });
    expect(result.faqs).toHaveLength(1);
    expect(result.faqs[0].order).toBe(0);
  });

  it("rejects faq without question", () => {
    const result = aboutPageSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      faqs: [{ answer: "A!" }],
    });
    expect(result.success).toBe(false);
  });

  it("parses with SEO fields", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      metaTitle: "About Me",
      metaDescription: "About page description",
      metaKeywords: "developer, portfolio",
      canonicalUrl: "https://example.com/about",
      ogImage: "https://example.com/og.jpg",
    });
    expect(result.metaTitle).toBe("About Me");
    expect(result.canonicalUrl).toBe("https://example.com/about");
  });

  it("parses with CTA fields", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      ctaHeading: "Let's Work Together",
      ctaDescription: "Get in touch",
      ctaPrimaryButton: "Contact Me",
      ctaPrimaryLink: "/contact",
      ctaSecondaryButton: "View Portfolio",
      ctaSecondaryLink: "/portfolio",
      ctaBackground: "blue",
    });
    expect(result.ctaHeading).toBe("Let's Work Together");
    expect(result.ctaPrimaryButton).toBe("Contact Me");
  });

  it("parses with all summary fields", () => {
    const result = aboutPageSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Developer",
      summaryHeading: "Summary",
      shortBio: "Short bio",
      fullBiography: "Full bio",
      yearsOfExperience: 10,
      missionStatement: "Mission",
      visionStatement: "Vision",
    });
    expect(result.summaryHeading).toBe("Summary");
    expect(result.yearsOfExperience).toBe(10);
    expect(result.missionStatement).toBe("Mission");
  });
});

describe("aboutStatisticSchema", () => {
  it("parses valid statistic", () => {
    const result = aboutStatisticSchema.parse({
      title: "Projects",
      value: "100+",
    });
    expect(result.title).toBe("Projects");
    expect(result.value).toBe("100+");
    expect(result.order).toBe(0);
  });

  it("rejects empty title", () => {
    const result = aboutStatisticSchema.safeParse({ title: "", value: "100" });
    expect(result.success).toBe(false);
  });

  it("rejects empty value", () => {
    const result = aboutStatisticSchema.safeParse({ title: "Projects", value: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = aboutStatisticSchema.parse({
      title: "Projects",
      value: "100+",
      suffix: "+",
      icon: "briefcase",
      order: 2,
    });
    expect(result.suffix).toBe("+");
    expect(result.icon).toBe("briefcase");
    expect(result.order).toBe(2);
  });
});

describe("aboutTechnologySchema", () => {
  it("parses valid technology", () => {
    const result = aboutTechnologySchema.parse({
      name: "React",
      category: "Frontend",
    });
    expect(result.name).toBe("React");
    expect(result.category).toBe("Frontend");
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = aboutTechnologySchema.safeParse({ name: "", category: "FE" });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = aboutTechnologySchema.safeParse({ name: "React", category: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = aboutTechnologySchema.parse({
      name: "React",
      category: "Frontend",
      logo: "https://example.com/react.png",
      experienceLevel: "Advanced",
      order: 1,
    });
    expect(result.logo).toBe("https://example.com/react.png");
    expect(result.experienceLevel).toBe("Advanced");
  });
});

describe("whyWorkWithMeItemSchema", () => {
  it("parses valid item", () => {
    const result = whyWorkWithMeItemSchema.parse({
      title: "Quality",
      description: "I deliver quality work",
    });
    expect(result.title).toBe("Quality");
    expect(result.description).toBe("I deliver quality work");
  });

  it("rejects empty title", () => {
    const result = whyWorkWithMeItemSchema.safeParse({
      title: "",
      description: "Desc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = whyWorkWithMeItemSchema.safeParse({
      title: "Quality",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts icon", () => {
    const result = whyWorkWithMeItemSchema.parse({
      title: "Quality",
      description: "Desc",
      icon: "star",
    });
    expect(result.icon).toBe("star");
  });
});

describe("workProcessStepSchema", () => {
  it("parses valid step", () => {
    const result = workProcessStepSchema.parse({
      step: 1,
      title: "Research",
      description: "Research phase",
    });
    expect(result.step).toBe(1);
    expect(result.title).toBe("Research");
    expect(result.description).toBe("Research phase");
  });

  it("rejects missing step", () => {
    const result = workProcessStepSchema.safeParse({
      title: "Research",
      description: "Phase",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = workProcessStepSchema.safeParse({
      step: 1,
      title: "",
      description: "Desc",
    });
    expect(result.success).toBe(false);
  });

  it("accepts icon", () => {
    const result = workProcessStepSchema.parse({
      step: 1,
      title: "Research",
      description: "Desc",
      icon: "search",
    });
    expect(result.icon).toBe("search");
  });
});

describe("personalInterestSchema", () => {
  it("parses valid interest", () => {
    const result = personalInterestSchema.parse({
      name: "Photography",
      description: "Love photography",
    });
    expect(result.name).toBe("Photography");
    expect(result.description).toBe("Love photography");
  });

  it("rejects empty name", () => {
    const result = personalInterestSchema.safeParse({
      name: "",
      description: "Desc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = personalInterestSchema.safeParse({
      name: "Photography",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts icon and image", () => {
    const result = personalInterestSchema.parse({
      name: "Photography",
      description: "Taking photos",
      icon: "camera",
      image: "https://example.com/photo.jpg",
    });
    expect(result.icon).toBe("camera");
    expect(result.image).toBe("https://example.com/photo.jpg");
  });
});

describe("socialLinkItemSchema", () => {
  it("parses valid social link", () => {
    const result = socialLinkItemSchema.parse({
      platform: "GitHub",
      url: "https://github.com/emmett",
    });
    expect(result.platform).toBe("GitHub");
    expect(result.url).toBe("https://github.com/emmett");
    expect(result.enabled).toBe(true);
  });

  it("rejects empty platform", () => {
    const result = socialLinkItemSchema.safeParse({
      platform: "",
      url: "https://example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid url", () => {
    const result = socialLinkItemSchema.safeParse({
      platform: "GitHub",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts icon and enabled false", () => {
    const result = socialLinkItemSchema.parse({
      platform: "Twitter",
      url: "https://twitter.com/emmett",
      icon: "twitter-icon",
      enabled: false,
    });
    expect(result.icon).toBe("twitter-icon");
    expect(result.enabled).toBe(false);
  });
});

describe("faqItemSchema", () => {
  it("parses valid faq", () => {
    const result = faqItemSchema.parse({
      question: "What is your experience?",
      answer: "10+ years",
    });
    expect(result.question).toBe("What is your experience?");
    expect(result.answer).toBe("10+ years");
    expect(result.order).toBe(0);
  });

  it("rejects empty question", () => {
    const result = faqItemSchema.safeParse({
      question: "",
      answer: "Answer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty answer", () => {
    const result = faqItemSchema.safeParse({
      question: "Q?",
      answer: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts order", () => {
    const result = faqItemSchema.parse({
      question: "Q?",
      answer: "A!",
      order: 5,
    });
    expect(result.order).toBe(5);
  });
});
