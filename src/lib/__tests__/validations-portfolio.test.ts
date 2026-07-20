import { describe, it, expect } from "vitest";
import {
  portfolioCategorySchema,
  technologySchema,
  projectMetricSchema,
  portfolioProjectSchema,
  caseStudySchema,
} from "../validations/portfolio";

describe("portfolioCategorySchema", () => {
  it("parses with minimal required fields", () => {
    const result = portfolioCategorySchema.parse({ name: "Web Development" });
    expect(result.name).toBe("Web Development");
  });

  it("rejects empty name", () => {
    const result = portfolioCategorySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = portfolioCategorySchema.parse({
      name: "Web Development",
      slug: "web-development",
      description: "Web projects",
      icon: "globe",
      order: 1,
    });
    expect(result.slug).toBe("web-development");
    expect(result.description).toBe("Web projects");
    expect(result.icon).toBe("globe");
    expect(result.order).toBe(1);
  });
});

describe("technologySchema", () => {
  it("parses with minimal required fields", () => {
    const result = technologySchema.parse({ name: "React" });
    expect(result.name).toBe("React");
  });

  it("rejects empty name", () => {
    const result = technologySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = technologySchema.parse({
      name: "React",
      slug: "react",
      icon: "react-icon",
      color: "#61dafb",
      category: "Frontend",
    });
    expect(result.slug).toBe("react");
    expect(result.icon).toBe("react-icon");
    expect(result.color).toBe("#61dafb");
    expect(result.category).toBe("Frontend");
  });
});

describe("projectMetricSchema", () => {
  it("parses with required fields", () => {
    const result = projectMetricSchema.parse({
      label: "Users",
      value: "1000+",
    });
    expect(result.label).toBe("Users");
    expect(result.value).toBe("1000+");
  });

  it("rejects empty label", () => {
    const result = projectMetricSchema.safeParse({
      label: "",
      value: "100",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty value", () => {
    const result = projectMetricSchema.safeParse({
      label: "Users",
      value: "",
    });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = projectMetricSchema.parse({
      id: "metric_1",
      label: "Users",
      value: "1000+",
      prefix: "+",
      suffix: " users",
      order: 1,
    });
    expect(result.id).toBe("metric_1");
    expect(result.prefix).toBe("+");
    expect(result.suffix).toBe(" users");
    expect(result.order).toBe(1);
  });
});

describe("portfolioProjectSchema", () => {
  it("parses with minimal required fields", () => {
    const result = portfolioProjectSchema.parse({ title: "My Project" });
    expect(result.title).toBe("My Project");
  });

  it("rejects empty title", () => {
    const result = portfolioProjectSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = portfolioProjectSchema.parse({
      title: "E-Commerce Platform",
      slug: "ecommerce-platform",
      shortDescription: "A full-featured e-commerce solution",
      fullDescription: "Built with Next.js and Stripe",
      projectSummary: "Summary here",
      clientName: "Acme Corp",
      clientIndustry: "Retail",
      categoryId: "cat_1",
      technologyIds: ["tech_1", "tech_2"],
      featuredImage: "https://example.com/featured.jpg",
      thumbnailImage: "https://example.com/thumb.jpg",
      galleryImages: ["https://example.com/img1.jpg"],
      videoDemo: "https://example.com/video.mp4",
      projectLogo: "https://example.com/logo.png",
      startDate: "2024-01-01",
      completionDate: "2024-06-01",
      projectDuration: "6 months",
      teamSize: 5,
      status: "completed",
      featured: true,
      published: true,
      order: 1,
      liveUrl: "https://example.com",
      githubUrl: "https://github.com/example",
      demoUrl: "https://demo.example.com",
      caseStudyUrl: "https://example.com/case-study",
      metaTitle: "SEO Title",
      metaDescription: "SEO Description",
      ogImage: "https://example.com/og.jpg",
      canonicalUrl: "https://example.com",
      tags: ["react", "nextjs"],
      awards: ["Best Design 2024"],
      testimonialIds: ["test_1"],
      metrics: [
        { label: "Users", value: "10k" },
        { label: "Revenue", value: "$500k" },
      ],
    });
    expect(result.title).toBe("E-Commerce Platform");
    expect(result.technologyIds).toEqual(["tech_1", "tech_2"]);
    expect(result.metrics).toHaveLength(2);
    expect(result.tags).toEqual(["react", "nextjs"]);
  });

  it("parses with optional arrays as empty by default", () => {
    const result = portfolioProjectSchema.parse({ title: "Test" });
    expect(result.technologyIds).toBeUndefined();
    expect(result.galleryImages).toBeUndefined();
    expect(result.tags).toBeUndefined();
    expect(result.metrics).toBeUndefined();
  });
});

describe("caseStudySchema", () => {
  it("parses empty object", () => {
    const result = caseStudySchema.parse({});
    expect(result).toEqual({});
  });

  it("parses with all fields", () => {
    const result = caseStudySchema.parse({
      clientBackground: "Background",
      businessProblem: "Problem",
      objectives: "Objectives",
      research: "Research",
      solution: "Solution",
      developmentProcess: "Process",
      results: "Results",
      lessonsLearned: "Lessons",
      challenges: "Challenges",
      requirements: "Requirements",
      projectGoals: "Goals",
      problemStatement: "Problem Statement",
    });
    expect(result.clientBackground).toBe("Background");
    expect(result.businessProblem).toBe("Problem");
    expect(result.objectives).toBe("Objectives");
    expect(result.research).toBe("Research");
    expect(result.solution).toBe("Solution");
    expect(result.developmentProcess).toBe("Process");
    expect(result.results).toBe("Results");
    expect(result.lessonsLearned).toBe("Lessons");
    expect(result.challenges).toBe("Challenges");
    expect(result.requirements).toBe("Requirements");
    expect(result.projectGoals).toBe("Goals");
    expect(result.problemStatement).toBe("Problem Statement");
  });
});
