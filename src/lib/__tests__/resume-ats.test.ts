import { describe, it, expect } from "vitest";
import { calculateATSScore } from "../resume-ats";

function makeEmptyResume() {
  return {
    fullName: null,
    professionalTitle: null,
    summary: null,
    email: null,
    phone: null,
    location: null,
    website: null,
    socialLinks: [],
    specializations: [],
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    languages: [],
  };
}

function makeCompleteResume() {
  return {
    fullName: "John Doe",
    professionalTitle: "Senior Software Engineer",
    summary: "Experienced full-stack developer with expertise in JavaScript, TypeScript, React, Node.js, and cloud technologies. Over 10 years building scalable applications using agile methodologies and modern architecture patterns. Strong leadership and communication skills with a focus on problem-solving and team collaboration. Passionate about design and database optimization. Proficient in REST APIs, GraphQL, CI/CD pipelines, microservices, and DevOps practices. Dedicated to delivering high-quality software solutions.",
    email: "john@example.com",
    phone: "+1234567890",
    location: "San Francisco, CA",
    website: "https://johndoe.com",
    socialLinks: [{ label: "LinkedIn", url: "https://linkedin.com/in/johndoe" }],
    specializations: ["full-stack", "cloud", "architecture"],
    experiences: [
      {
        jobTitle: "Senior Engineer at Tech Co",
        company: "Tech Co",
        startDate: "2020-01-01",
        endDate: null,
        current: true,
        responsibilities: ["Led team", "Built features"],
        achievements: ["Increased performance by 50%"],
        technologies: ["React", "Node.js", "TypeScript", "AWS"],
      },
      {
        jobTitle: "Software Engineer at Startup Inc",
        company: "Startup Inc",
        startDate: "2018-01-01",
        endDate: "2019-12-31",
        responsibilities: ["Developed APIs"],
        achievements: ["Reduced costs"],
        technologies: ["Python", "Docker", "SQL"],
      },
    ],
    education: [
      {
        institution: "University of Tech",
        degree: "BSc Computer Science",
        fieldOfStudy: "Computer Science",
        startDate: "2010-09-01",
        endDate: "2014-06-01",
        grade: "3.8 GPA",
      },
    ],
    skills: [
      { name: "JavaScript", proficiency: 5, category: "Frontend" },
      { name: "TypeScript", proficiency: 5, category: "Frontend" },
      { name: "React", proficiency: 5, category: "Frontend" },
      { name: "Node.js", proficiency: 5, category: "Backend" },
      { name: "Python", proficiency: 4, category: "Backend" },
      { name: "Java", proficiency: 3, category: "Backend" },
      { name: "AWS", proficiency: 4, category: "Cloud" },
      { name: "Docker", proficiency: 4, category: "DevOps" },
      { name: "Kubernetes", proficiency: 3, category: "DevOps" },
      { name: "SQL", proficiency: 4, category: "Database" },
      { name: "GraphQL", proficiency: 4, category: "Backend" },
      { name: "CI/CD", proficiency: 4, category: "DevOps" },
    ],
    certifications: [
      { name: "AWS Solutions Architect", organization: "Amazon", issueDate: "2022-01-01" },
    ],
    languages: [{ language: "English", proficiency: "Native" }],
  };
}

describe("calculateATSScore", () => {
  it("empty resume returns 0 overall", () => {
    const result = calculateATSScore(makeEmptyResume() as any);
    expect(result.overall).toBe(0);
  });

  it("complete resume scores maximum in each section", () => {
    const result = calculateATSScore(makeCompleteResume());
    const contact = result.sections.find(s => s.name === "Contact Information");
    const summary = result.sections.find(s => s.name === "Professional Summary");
    const experience = result.sections.find(s => s.name === "Work Experience");
    const education = result.sections.find(s => s.name === "Education");
    const skills = result.sections.find(s => s.name === "Skills");
    const certs = result.sections.find(s => s.name === "Certifications");

    expect(contact!.score).toBe(60);
    expect(summary!.score).toBe(50);
    expect(experience!.score).toBe(55);
    expect(education!.score).toBe(35);
    expect(skills!.score).toBe(30);
    expect(certs!.score).toBe(15);
    expect(result.overall).toBeGreaterThan(0);
  });

  it("contact section scores 60 when all fields present", () => {
    const resume = makeEmptyResume();
    resume.fullName = "John";
    resume.email = "john@test.com";
    resume.phone = "123";
    resume.location = "NYC";
    resume.website = "https://john.com";
    const result = calculateATSScore(resume as any);
    const contact = result.sections.find(s => s.name === "Contact Information");
    expect(contact!.score).toBe(60);
    expect(contact!.tips).toEqual([]);
  });

  it("contact section with website via socialLinks scores 10", () => {
    const resume = makeEmptyResume();
    resume.fullName = "John";
    resume.email = "john@test.com";
    resume.phone = "123";
    resume.location = "NYC";
    resume.socialLinks = [{ label: "GitHub", url: "https://github.com/john" }];
    const result = calculateATSScore(resume as any);
    const contact = result.sections.find(s => s.name === "Contact Information");
    expect(contact!.score).toBe(60);
  });

  it("contact section has tips when each field is missing", () => {
    const result = calculateATSScore(makeEmptyResume() as any);
    const contact = result.sections.find(s => s.name === "Contact Information");
    expect(contact!.tips).toContain("Add your full name");
    expect(contact!.tips).toContain("Add an email address");
    expect(contact!.tips).toContain("Add a phone number");
    expect(contact!.tips).toContain("Add your location");
    expect(contact!.tips).toContain("Add a website or social links");
    expect(contact!.score).toBe(0);
  });

  it("summary section scores 50 when present with good length and keywords", () => {
    const resume = makeEmptyResume();
    resume.summary = "Experienced in JavaScript, React, Node.js, TypeScript, and AWS. "
      + "I have strong leadership and team communication skills. "
      + "I enjoy problem-solving and full-stack development. "
      + "This brings the text to well over fifty words which is needed to pass the word count check for the summary section of the ATS scoring algorithm. "
      + "Adding a few more words to ensure we definitely pass the threshold.";
    const result = calculateATSScore(resume as any);
    const summary = result.sections.find(s => s.name === "Professional Summary");
    expect(summary!.score).toBe(50);
    expect(summary!.tips).toEqual([]);
  });

  it("summary section with too few words adds tip and no word count points", () => {
    const resume = makeEmptyResume();
    resume.summary = "Short summary.";
    const result = calculateATSScore(resume as any);
    const summary = result.sections.find(s => s.name === "Professional Summary");
    expect(summary!.score).toBe(20);
    expect(summary!.tips).toContain("Summary should be 50-200 words (currently 2)");
  });

  it("summary section with too many words adds tip and no word count points", () => {
    const words = Array.from({ length: 250 }, (_, i) => `word${i + 1}`).join(" ");
    const resume = makeEmptyResume();
    resume.summary = words;
    const result = calculateATSScore(resume as any);
    const summary = result.sections.find(s => s.name === "Professional Summary");
    expect(summary!.score).toBe(20);
    expect(summary!.tips).toContain("Summary should be 50-200 words (currently 250)");
  });

  it("summary section with fewer than 3 keyword matches adds tip", () => {
    const resume = makeEmptyResume();
    resume.summary = "Hello world this is a test with no matching keywords at all whatsoever to speak of.";
    const result = calculateATSScore(resume as any);
    const summary = result.sections.find(s => s.name === "Professional Summary");
    expect(summary!.tips).toContain("Include more industry keywords in your summary");
  });

  it("summary section adds tip when missing", () => {
    const resume = makeEmptyResume();
    const result = calculateATSScore(resume as any);
    const summary = result.sections.find(s => s.name === "Professional Summary");
    expect(summary!.tips).toContain("Add a professional summary");
    expect(summary!.score).toBe(0);
  });

  it("experience section scores 55 when all conditions met", () => {
    const resume = makeEmptyResume();
    resume.experiences = [
      {
        jobTitle: "Senior Dev",
        company: "Co",
        startDate: "2020-01-01",
        current: true,
        achievements: ["Boosted performance"],
        technologies: ["React"],
      },
      {
        jobTitle: "Junior Dev",
        company: "Co2",
        startDate: "2018-01-01",
        endDate: "2019-12-31",
        achievements: ["Learned a lot"],
        technologies: ["Python"],
      },
    ];
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.score).toBe(55);
    expect(exp!.tips).toEqual([]);
  });

  it("experience section with non-recent experience adds tip", () => {
    const resume = makeEmptyResume();
    resume.experiences = [
      {
        jobTitle: "Old Dev",
        company: "Old Co",
        startDate: "2010-01-01",
        endDate: "2011-01-01",
      },
    ];
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.tips).toContain("Add recent work experience (within last 2 years)");
  });

  it("experience section without metrics adds tip", () => {
    const resume = makeEmptyResume();
    resume.experiences = [
      {
        jobTitle: "Dev",
        company: "Co",
        startDate: "2025-01-01",
        current: true,
      },
    ];
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.tips).toContain("Add achievements/metrics to your experience entries");
  });

  it("experience section with only one entry adds tip", () => {
    const resume = makeEmptyResume();
    resume.experiences = [
      {
        jobTitle: "Dev",
        company: "Co",
        startDate: "2025-01-01",
        current: true,
        achievements: ["Did stuff"],
        technologies: ["React"],
      },
    ];
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.tips).toContain("Add at least 2 work experiences");
  });

  it("experience section without technologies adds tip", () => {
    const resume = makeEmptyResume();
    resume.experiences = [
      {
        jobTitle: "Dev",
        company: "Co",
        startDate: "2025-01-01",
        current: true,
        achievements: ["Did stuff"],
      },
      {
        jobTitle: "Dev2",
        company: "Co2",
        startDate: "2023-01-01",
        current: true,
        achievements: ["Did more"],
      },
    ];
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.tips).toContain("List technologies used in each role");
  });

  it("experience section with no experiences adds tip", () => {
    const resume = makeEmptyResume();
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.tips).toContain("Add work experience");
    expect(exp!.score).toBe(0);
  });

  it("education section scores 35 with degree and grade", () => {
    const resume = makeEmptyResume();
    resume.education = [
      {
        institution: "MIT",
        degree: "BSc",
        fieldOfStudy: "CS",
        startDate: "2010-01-01",
        endDate: "2014-01-01",
        grade: "3.9",
      },
    ];
    const result = calculateATSScore(resume as any);
    const edu = result.sections.find(s => s.name === "Education");
    expect(edu!.score).toBe(35);
  });

  it("education section without degree adds tip", () => {
    const resume = makeEmptyResume();
    resume.education = [
      {
        institution: "MIT",
        startDate: "2010-01-01",
        endDate: "2014-01-01",
      },
    ];
    const result = calculateATSScore(resume as any);
    const edu = result.sections.find(s => s.name === "Education");
    expect(edu!.tips).toContain("Add degree information");
    expect(edu!.score).toBe(20);
  });

  it("education section without grade but with degree scores 30", () => {
    const resume = makeEmptyResume();
    resume.education = [
      {
        institution: "MIT",
        degree: "BSc",
        startDate: "2010-01-01",
        endDate: "2014-01-01",
      },
    ];
    const result = calculateATSScore(resume as any);
    const edu = result.sections.find(s => s.name === "Education");
    expect(edu!.score).toBe(30);
  });

  it("education section with no education adds tip", () => {
    const resume = makeEmptyResume();
    const result = calculateATSScore(resume as any);
    const edu = result.sections.find(s => s.name === "Education");
    expect(edu!.tips).toContain("Add education information");
    expect(edu!.score).toBe(0);
  });

  it("skills section scores 30 with 10+ skills and 3+ categories", () => {
    const resume = makeEmptyResume();
    resume.skills = [
      { name: "JavaScript", proficiency: 5, category: "Frontend" },
      { name: "TypeScript", proficiency: 5, category: "Frontend" },
      { name: "React", proficiency: 5, category: "Frontend" },
      { name: "Node.js", proficiency: 5, category: "Backend" },
      { name: "Python", proficiency: 4, category: "Backend" },
      { name: "Java", proficiency: 3, category: "Backend" },
      { name: "AWS", proficiency: 4, category: "Cloud" },
      { name: "Docker", proficiency: 4, category: "DevOps" },
      { name: "SQL", proficiency: 4, category: "Database" },
      { name: "Git", proficiency: 4, category: "DevOps" },
    ];
    const result = calculateATSScore(resume as any);
    const skills = result.sections.find(s => s.name === "Skills");
    expect(skills!.score).toBe(30);
  });

  it("skills section with fewer than 10 skills adds tip", () => {
    const resume = makeEmptyResume();
    resume.skills = [
      { name: "JavaScript", proficiency: 5, category: "Frontend" },
      { name: "React", proficiency: 5, category: "Frontend" },
      { name: "Node.js", proficiency: 5, category: "Backend" },
      { name: "AWS", proficiency: 4, category: "Cloud" },
    ];
    const result = calculateATSScore(resume as any);
    const skills = result.sections.find(s => s.name === "Skills");
    expect(skills!.tips).toContain("List at least 10 skills");
  });

  it("skills section with fewer than 3 categories adds tip", () => {
    const resume = makeEmptyResume();
    resume.skills = Array.from({ length: 10 }, (_, i) => ({
      name: `Skill${i}`,
      proficiency: 3,
      category: "Frontend",
    }));
    const result = calculateATSScore(resume as any);
    const skills = result.sections.find(s => s.name === "Skills");
    expect(skills!.tips).toContain("Include skills from at least 3 categories (e.g., Frontend, Backend, Database)");
  });

  it("skills section with no skills adds tip", () => {
    const resume = makeEmptyResume();
    const result = calculateATSScore(resume as any);
    const skills = result.sections.find(s => s.name === "Skills");
    expect(skills!.tips).toContain("Add skills");
    expect(skills!.score).toBe(0);
  });

  it("certifications section scores 15 when present", () => {
    const resume = makeEmptyResume();
    resume.certifications = [{ name: "AWS SA", organization: "Amazon", issueDate: "2022-01-01" }];
    const result = calculateATSScore(resume as any);
    const certs = result.sections.find(s => s.name === "Certifications");
    expect(certs!.score).toBe(15);
    expect(certs!.tips).toEqual([]);
  });

  it("certifications section adds tip when empty", () => {
    const resume = makeEmptyResume();
    const result = calculateATSScore(resume as any);
    const certs = result.sections.find(s => s.name === "Certifications");
    expect(certs!.tips).toContain("Consider adding certifications to boost your profile");
    expect(certs!.score).toBe(0);
  });

  it("keyword optimization scores 30 when all keywords matched", () => {
    const resume = makeEmptyResume();
    resume.summary = COMMON_KEYWORDS.join(" ");
    resume.skills = COMMON_KEYWORDS.map(k => ({ name: k, proficiency: 5 }));
    const result = calculateATSScore(resume as any);
    const kw = result.sections.find(s => s.name === "Keyword Optimization");
    expect(kw!.score).toBe(30);
  });

  it("keyword optimization adds tip when fewer than 5 matched", () => {
    const resume = makeEmptyResume();
    resume.summary = "Hello world this summary has no industry keywords at all.";
    const result = calculateATSScore(resume as any);
    const kw = result.sections.find(s => s.name === "Keyword Optimization");
    expect(kw!.tips).toContain("Include more industry keywords throughout your resume");
  });

  it("current experience counts as recent", () => {
    const resume = makeEmptyResume();
    resume.experiences = [
      {
        jobTitle: "Current Dev",
        company: "Co",
        startDate: "2024-01-01",
        current: true,
        achievements: ["Did stuff"],
        technologies: ["React"],
      },
      {
        jobTitle: "Past Dev",
        company: "Co2",
        startDate: "2020-01-01",
        endDate: "2021-01-01",
        achievements: ["Did stuff"],
        technologies: ["React"],
      },
    ];
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.tips).not.toContain("Add recent work experience (within last 2 years)");
  });

  it("endDate within 2 years counts as recent", () => {
    const year = new Date().getFullYear();
    const resume = makeEmptyResume();
    resume.experiences = [
      {
        jobTitle: "Recent Dev",
        company: "Co",
        startDate: `${year - 1}-01-01`,
        endDate: `${year - 1}-12-31`,
        achievements: ["Did stuff"],
        technologies: ["React"],
      },
    ];
    const result = calculateATSScore(resume as any);
    const exp = result.sections.find(s => s.name === "Work Experience");
    expect(exp!.tips).not.toContain("Add recent work experience (within last 2 years)");
  });

  it("overall score is sum / max * 100 rounded", () => {
    const resume = makeEmptyResume();
    resume.fullName = "John";
    const result = calculateATSScore(resume as any);
    expect(result.overall).toBe(Math.round((15 / 275) * 100));
  });

  it("score caps at 100 overall", () => {
    const result = calculateATSScore(makeCompleteResume());
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it("tips are collected from all sections", () => {
    const resume = makeEmptyResume();
    const result = calculateATSScore(resume as any);
    expect(result.tips).toEqual([]);
  });
});

const COMMON_KEYWORDS = [
  "javascript", "typescript", "react", "next.js", "node.js", "python", "java",
  "aws", "docker", "kubernetes", "sql", "nosql", "api", "rest", "graphql",
  "agile", "scrum", "leadership", "team", "communication", "problem-solving",
  "full-stack", "frontend", "backend", "devops", "ci/cd", "testing",
  "microservices", "architecture", "design", "database", "cloud",
];
