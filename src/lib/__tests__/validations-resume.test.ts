import { describe, it, expect } from "vitest";
import {
  socialLinkSchema,
  resumeProfileSchema,
  experienceSchema,
  educationSchema,
  skillSchema,
  certificationSchema,
  awardSchema,
  languageSchema,
  referenceSchema,
} from "../validations/resume";

describe("socialLinkSchema", () => {
  it("parses valid social link", () => {
    const result = socialLinkSchema.parse({
      label: "GitHub",
      url: "https://github.com/emmett",
    });
    expect(result.label).toBe("GitHub");
    expect(result.url).toBe("https://github.com/emmett");
  });

  it("rejects invalid url", () => {
    const result = socialLinkSchema.safeParse({
      label: "GitHub",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("accepts icon", () => {
    const result = socialLinkSchema.parse({
      label: "GitHub",
      url: "https://github.com/emmett",
      icon: "github-icon",
    });
    expect(result.icon).toBe("github-icon");
  });
});

describe("resumeProfileSchema", () => {
  it("parses valid profile", () => {
    const result = resumeProfileSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Developer",
    });
    expect(result.fullName).toBe("Emmett");
    expect(result.professionalTitle).toBe("Developer");
    expect(result.template).toBe("modern");
    expect(result.published).toBe(false);
    expect(result.specializations).toEqual([]);
    expect(result.socialLinks).toEqual([]);
  });

  it("rejects empty fullName", () => {
    const result = resumeProfileSchema.safeParse({
      fullName: "",
      professionalTitle: "Dev",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty professionalTitle", () => {
    const result = resumeProfileSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid template", () => {
    const result = resumeProfileSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      template: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts nullable fields", () => {
    const result = resumeProfileSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      photo: null,
      location: null,
      yearsOfExperience: null,
      summary: null,
      summaryTitle: null,
    });
    expect(result.photo).toBeNull();
    expect(result.location).toBeNull();
  });

  it("accepts email as empty string", () => {
    const result = resumeProfileSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      email: "",
    });
    expect(result.email).toBe("");
  });

  it("rejects invalid email", () => {
    const result = resumeProfileSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid website", () => {
    const result = resumeProfileSchema.safeParse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      website: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("accepts website as empty string", () => {
    const result = resumeProfileSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Dev",
      website: "",
    });
    expect(result.website).toBe("");
  });

  it("parses with all fields", () => {
    const result = resumeProfileSchema.parse({
      fullName: "Emmett",
      professionalTitle: "Full Stack Developer",
      photo: "https://example.com/photo.jpg",
      location: "San Francisco",
      yearsOfExperience: 10,
      summary: "Experienced developer",
      summaryTitle: "About Me",
      specializations: ["React", "Node.js"],
      socialLinks: [{ label: "GitHub", url: "https://github.com/emmett" }],
      email: "emmett@example.com",
      phone: "+1234567890",
      website: "https://emmett.dev",
      template: "developer",
      metaTitle: "Resume",
      metaDescription: "My resume",
      ogImage: "https://example.com/og.jpg",
      published: true,
    });
    expect(result.fullName).toBe("Emmett");
    expect(result.specializations).toEqual(["React", "Node.js"]);
    expect(result.socialLinks).toHaveLength(1);
    expect(result.template).toBe("developer");
    expect(result.published).toBe(true);
  });
});

describe("experienceSchema", () => {
  it("parses valid experience", () => {
    const result = experienceSchema.parse({
      jobTitle: "Developer",
      company: "Acme",
      startDate: "2020-01-01",
    });
    expect(result.jobTitle).toBe("Developer");
    expect(result.company).toBe("Acme");
    expect(result.startDate).toBe("2020-01-01");
    expect(result.employmentType).toBe("Full-Time");
    expect(result.current).toBe(false);
    expect(result.responsibilities).toEqual([]);
    expect(result.achievements).toEqual([]);
    expect(result.technologies).toEqual([]);
    expect(result.order).toBe(0);
  });

  it("rejects empty jobTitle", () => {
    const result = experienceSchema.safeParse({
      jobTitle: "",
      company: "Acme",
      startDate: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty company", () => {
    const result = experienceSchema.safeParse({
      jobTitle: "Dev",
      company: "",
      startDate: "2020-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid employmentType", () => {
    const result = experienceSchema.safeParse({
      jobTitle: "Dev",
      company: "Acme",
      startDate: "2020-01-01",
      employmentType: "INVALID",
    });
    expect(result.success).toBe(false);
  });

  it("parses with current position", () => {
    const result = experienceSchema.parse({
      jobTitle: "Dev",
      company: "Acme",
      startDate: "2020-01-01",
      current: true,
    });
    expect(result.current).toBe(true);
  });

  it("parses with all fields", () => {
    const result = experienceSchema.parse({
      jobTitle: "Senior Developer",
      company: "Acme Corp",
      employmentType: "Contract",
      location: "Remote",
      startDate: "2020-01-01",
      endDate: "2023-12-31",
      current: false,
      responsibilities: ["Lead team", "Code review"],
      achievements: ["Shipped v2"],
      technologies: ["React", "Node"],
      order: 1,
    });
    expect(result.employmentType).toBe("Contract");
    expect(result.responsibilities).toEqual(["Lead team", "Code review"]);
    expect(result.achievements).toEqual(["Shipped v2"]);
  });
});

describe("educationSchema", () => {
  it("parses valid education", () => {
    const result = educationSchema.parse({
      institution: "MIT",
      startDate: "2010-09-01",
    });
    expect(result.institution).toBe("MIT");
    expect(result.startDate).toBe("2010-09-01");
    expect(result.order).toBe(0);
  });

  it("rejects empty institution", () => {
    const result = educationSchema.safeParse({
      institution: "",
      startDate: "2010-09-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty startDate", () => {
    const result = educationSchema.safeParse({
      institution: "MIT",
      startDate: "",
    });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = educationSchema.parse({
      institution: "MIT",
      degree: "BS",
      fieldOfStudy: "Computer Science",
      startDate: "2010-09-01",
      endDate: "2014-06-01",
      grade: "3.8 GPA",
      description: "Focus on AI",
      order: 1,
    });
    expect(result.degree).toBe("BS");
    expect(result.fieldOfStudy).toBe("Computer Science");
    expect(result.grade).toBe("3.8 GPA");
  });
});

describe("skillSchema", () => {
  it("parses valid skill", () => {
    const result = skillSchema.parse({
      name: "React",
    });
    expect(result.name).toBe("React");
    expect(result.category).toBe("Other");
    expect(result.proficiency).toBe(50);
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = skillSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects proficiency below 0", () => {
    const result = skillSchema.safeParse({ name: "React", proficiency: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects proficiency above 100", () => {
    const result = skillSchema.safeParse({ name: "React", proficiency: 101 });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = skillSchema.parse({
      name: "React",
      category: "Frontend",
      proficiency: 90,
      yearsOfExperience: 5,
      order: 1,
    });
    expect(result.category).toBe("Frontend");
    expect(result.proficiency).toBe(90);
    expect(result.yearsOfExperience).toBe(5);
  });
});

describe("certificationSchema", () => {
  it("parses valid certification", () => {
    const result = certificationSchema.parse({
      name: "AWS Certified",
      organization: "Amazon",
      issueDate: "2023-01-01",
    });
    expect(result.name).toBe("AWS Certified");
    expect(result.organization).toBe("Amazon");
    expect(result.issueDate).toBe("2023-01-01");
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = certificationSchema.safeParse({
      name: "",
      organization: "Amazon",
      issueDate: "2023-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty organization", () => {
    const result = certificationSchema.safeParse({
      name: "AWS",
      organization: "",
      issueDate: "2023-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid credentialUrl", () => {
    const result = certificationSchema.safeParse({
      name: "AWS",
      organization: "Amazon",
      issueDate: "2023-01-01",
      credentialUrl: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("accepts credentialUrl as empty string", () => {
    const result = certificationSchema.parse({
      name: "AWS",
      organization: "Amazon",
      issueDate: "2023-01-01",
      credentialUrl: "",
    });
    expect(result.credentialUrl).toBe("");
  });
});

describe("awardSchema", () => {
  it("parses valid award", () => {
    const result = awardSchema.parse({
      title: "Best Developer",
    });
    expect(result.title).toBe("Best Developer");
    expect(result.order).toBe(0);
  });

  it("rejects empty title", () => {
    const result = awardSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("parses with all fields", () => {
    const result = awardSchema.parse({
      title: "Best Developer",
      organization: "Tech Awards",
      date: "2024-01-01",
      description: "Awarded for excellence",
      order: 1,
    });
    expect(result.organization).toBe("Tech Awards");
    expect(result.description).toBe("Awarded for excellence");
  });
});

describe("languageSchema", () => {
  it("parses valid language", () => {
    const result = languageSchema.parse({
      language: "English",
    });
    expect(result.language).toBe("English");
    expect(result.proficiency).toBe("Native");
    expect(result.order).toBe(0);
  });

  it("rejects empty language", () => {
    const result = languageSchema.safeParse({ language: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid proficiency", () => {
    const result = languageSchema.safeParse({
      language: "English",
      proficiency: "Expert",
    });
    expect(result.success).toBe(false);
  });

  it("parses with all valid proficiencies", () => {
    const proficiencies = ["Beginner", "Intermediate", "Advanced", "Fluent", "Native"] as const;
    for (const p of proficiencies) {
      const result = languageSchema.parse({ language: "English", proficiency: p });
      expect(result.proficiency).toBe(p);
    }
  });
});

describe("referenceSchema", () => {
  it("parses valid reference", () => {
    const result = referenceSchema.parse({
      name: "Jane Doe",
    });
    expect(result.name).toBe("Jane Doe");
    expect(result.isPublic).toBe(true);
    expect(result.order).toBe(0);
  });

  it("rejects empty name", () => {
    const result = referenceSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = referenceSchema.safeParse({
      name: "Jane",
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty email", () => {
    const result = referenceSchema.parse({
      name: "Jane",
      email: "",
    });
    expect(result.email).toBe("");
  });

  it("parses with all fields", () => {
    const result = referenceSchema.parse({
      name: "Jane Doe",
      position: "CTO",
      organization: "Acme",
      email: "jane@acme.com",
      phone: "+1234567890",
      isPublic: false,
      order: 1,
    });
    expect(result.position).toBe("CTO");
    expect(result.organization).toBe("Acme");
    expect(result.email).toBe("jane@acme.com");
    expect(result.isPublic).toBe(false);
  });
});
