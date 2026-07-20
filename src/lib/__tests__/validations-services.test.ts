import { describe, it, expect } from "vitest";
import {
  createServiceCategorySchema,
  updateServiceCategorySchema,
  createServicePackageSchema,
  updateServicePackageSchema,
  createServiceFaqSchema,
  updateServiceFaqSchema,
  createServiceInquirySchema,
  updateServiceInquirySchema,
  createServiceSchema,
  updateServiceSchema,
} from "../validations/services";

describe("createServiceCategorySchema", () => {
  it("parses valid category", () => {
    const result = createServiceCategorySchema.parse({
      name: "Web Development",
      slug: "web-development",
    });
    expect(result.name).toBe("Web Development");
    expect(result.slug).toBe("web-development");
  });

  it("rejects empty name", () => {
    const result = createServiceCategorySchema.safeParse({
      name: "",
      slug: "web-dev",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = createServiceCategorySchema.safeParse({
      name: "Test",
      slug: "INVALID SLUG!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty slug", () => {
    const result = createServiceCategorySchema.safeParse({
      name: "Test",
      slug: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createServiceCategorySchema.parse({
      name: "Web Development",
      slug: "web-development",
      description: "Web services",
      icon: "globe",
      image: "https://example.com/img.png",
      order: 1,
    });
    expect(result.description).toBe("Web services");
    expect(result.icon).toBe("globe");
    expect(result.order).toBe(1);
  });
});

describe("updateServiceCategorySchema", () => {
  it("parses empty object", () => {
    const result = updateServiceCategorySchema.parse({});
    expect(result).toEqual({});
  });
});

describe("createServicePackageSchema", () => {
  it("parses valid package", () => {
    const result = createServicePackageSchema.parse({
      name: "Basic",
      price: 500,
      serviceId: "svc_1",
    });
    expect(result.name).toBe("Basic");
    expect(result.price).toBe(500);
    expect(result.serviceId).toBe("svc_1");
    expect(result.features).toEqual([]);
    expect(result.revisions).toBe(0);
    expect(result.isPopular).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createServicePackageSchema.safeParse({
      name: "",
      price: 500,
      serviceId: "svc_1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative price", () => {
    const result = createServicePackageSchema.safeParse({
      name: "Basic",
      price: -1,
      serviceId: "svc_1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty serviceId", () => {
    const result = createServicePackageSchema.safeParse({
      name: "Basic",
      price: 500,
      serviceId: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createServicePackageSchema.parse({
      name: "Pro",
      description: "Pro package",
      price: 1000,
      features: ["Feature 1", "Feature 2"],
      deliveryTime: "2 weeks",
      revisions: 3,
      supportDuration: "1 month",
      isPopular: true,
      order: 1,
      serviceId: "svc_1",
    });
    expect(result.features).toEqual(["Feature 1", "Feature 2"]);
    expect(result.isPopular).toBe(true);
    expect(result.revisions).toBe(3);
  });
});

describe("updateServicePackageSchema", () => {
  it("parses empty object", () => {
    const result = updateServicePackageSchema.parse({});
    expect(result).toEqual({
      features: [],
      isPopular: false,
      revisions: 0,
    });
  });
});

describe("createServiceFaqSchema", () => {
  it("parses valid faq", () => {
    const result = createServiceFaqSchema.parse({
      question: "What is included?",
      answer: "Everything",
    });
    expect(result.question).toBe("What is included?");
    expect(result.answer).toBe("Everything");
  });

  it("rejects empty question", () => {
    const result = createServiceFaqSchema.safeParse({
      question: "",
      answer: "Answer",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty answer", () => {
    const result = createServiceFaqSchema.safeParse({
      question: "Q?",
      answer: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createServiceFaqSchema.parse({
      question: "Q?",
      answer: "A!",
      order: 1,
      serviceId: "svc_1",
    });
    expect(result.order).toBe(1);
    expect(result.serviceId).toBe("svc_1");
  });
});

describe("updateServiceFaqSchema", () => {
  it("parses empty object", () => {
    const result = updateServiceFaqSchema.parse({});
    expect(result).toEqual({});
  });
});

describe("createServiceInquirySchema", () => {
  it("parses valid inquiry", () => {
    const result = createServiceInquirySchema.parse({
      fullName: "John Doe",
      email: "john@example.com",
      message: "I need a website",
    });
    expect(result.fullName).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.message).toBe("I need a website");
  });

  it("rejects empty fullName", () => {
    const result = createServiceInquirySchema.safeParse({
      fullName: "",
      email: "john@example.com",
      message: "Help",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = createServiceInquirySchema.safeParse({
      fullName: "John",
      email: "bad",
      message: "Help",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = createServiceInquirySchema.safeParse({
      fullName: "John",
      email: "john@example.com",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const result = createServiceInquirySchema.parse({
      serviceId: "svc_1",
      serviceName: "Web Dev",
      fullName: "John",
      email: "john@example.com",
      phone: "+1234567890",
      company: "Acme",
      budget: "$5000",
      message: "Need help",
    });
    expect(result.serviceId).toBe("svc_1");
    expect(result.phone).toBe("+1234567890");
    expect(result.budget).toBe("$5000");
  });
});

describe("updateServiceInquirySchema", () => {
  it("parses with status", () => {
    const result = updateServiceInquirySchema.parse({
      status: "QUALIFIED",
    });
    expect(result.status).toBe("QUALIFIED");
  });

  it("rejects invalid status", () => {
    const result = updateServiceInquirySchema.safeParse({
      status: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("accepts notes", () => {
    const result = updateServiceInquirySchema.parse({
      status: "NEW",
      notes: "Follow up needed",
    });
    expect(result.notes).toBe("Follow up needed");
  });
});

describe("createServiceSchema", () => {
  it("parses valid service", () => {
    const result = createServiceSchema.parse({
      title: "Web Development",
      slug: "web-development",
      categoryId: "cat_1",
    });
    expect(result.title).toBe("Web Development");
    expect(result.slug).toBe("web-development");
    expect(result.categoryId).toBe("cat_1");
    expect(result.features).toEqual([]);
    expect(result.benefits).toEqual([]);
    expect(result.technologies).toEqual([]);
    expect(result.deliverables).toEqual([]);
    expect(result.galleryImages).toEqual([]);
    expect(result.testimonialIds).toEqual([]);
    expect(result.tags).toEqual([]);
    expect(result.packages).toEqual([]);
    expect(result.faqs).toEqual([]);
    expect(result.featured).toBe(false);
    expect(result.published).toBe(false);
  });

  it("rejects empty title", () => {
    const result = createServiceSchema.safeParse({
      title: "",
      slug: "web-dev",
      categoryId: "cat_1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug", () => {
    const result = createServiceSchema.safeParse({
      title: "Web Dev",
      slug: "INVALID SLUG!",
      categoryId: "cat_1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty categoryId", () => {
    const result = createServiceSchema.safeParse({
      title: "Web Dev",
      slug: "web-dev",
      categoryId: "",
    });
    expect(result.success).toBe(false);
  });

  it("parses with preprocessed startingPrice", () => {
    const result = createServiceSchema.parse({
      title: "Web Dev",
      slug: "web-dev",
      categoryId: "cat_1",
      startingPrice: 1000,
    });
    expect(result.startingPrice).toBe(1000);
  });

  it("accepts null startingPrice", () => {
    const result = createServiceSchema.parse({
      title: "Web Dev",
      slug: "web-dev",
      categoryId: "cat_1",
      startingPrice: null,
    });
    expect(result.startingPrice).toBeNull();
  });

  it("parses with nested packages", () => {
    const result = createServiceSchema.parse({
      title: "Web Dev",
      slug: "web-dev",
      categoryId: "cat_1",
      packages: [
        { name: "Basic", price: 500, serviceId: "svc_1" },
      ],
    });
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0].name).toBe("Basic");
  });

  it("parses with nested faqs", () => {
    const result = createServiceSchema.parse({
      title: "Web Dev",
      slug: "web-dev",
      categoryId: "cat_1",
      faqs: [
        { question: "Q?", answer: "A!" },
      ],
    });
    expect(result.faqs).toHaveLength(1);
  });

  it("parses with all fields", () => {
    const result = createServiceSchema.parse({
      title: "Web Development",
      slug: "web-development",
      shortDescription: "Short desc",
      fullDescription: "Full desc",
      categoryId: "cat_1",
      icon: "globe",
      featuredImage: "https://example.com/img.jpg",
      galleryImages: ["https://example.com/img1.jpg"],
      features: ["Feature 1"],
      benefits: ["Benefit 1"],
      technologies: ["React"],
      deliverables: ["Code"],
      estimatedTimeline: "4 weeks",
      startingPrice: 5000,
      featured: true,
      published: true,
      order: 1,
      metaTitle: "SEO Title",
      metaDescription: "SEO Desc",
      ogImage: "https://example.com/og.jpg",
      canonicalUrl: "https://example.com",
      testimonialIds: ["test_1"],
      tags: ["web"],
    });
    expect(result.features).toEqual(["Feature 1"]);
    expect(result.featured).toBe(true);
    expect(result.published).toBe(true);
  });
});

describe("updateServiceSchema", () => {
  it("parses empty object", () => {
    const result = updateServiceSchema.parse({});
    expect(result).toEqual({
      benefits: [],
      deliverables: [],
      faqs: [],
      featured: false,
      features: [],
      galleryImages: [],
      packages: [],
      published: false,
      tags: [],
      technologies: [],
      testimonialIds: [],
    });
  });
});
