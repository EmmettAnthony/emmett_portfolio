interface ATSResult {
  overall: number;
  sections: {
    name: string;
    score: number;
    maxScore: number;
    tips: string[];
  }[];
  tips: string[];
}

interface ResumeData {
  fullName?: string | null;
  professionalTitle?: string | null;
  summary?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  website?: string | null;
  socialLinks?: { label: string; url: string }[];
  specializations?: string[];
  experiences?: {
    jobTitle: string;
    company: string;
    startDate: string | Date;
    endDate?: string | Date | null;
    current?: boolean;
    responsibilities?: string[];
    achievements?: string[];
    technologies?: string[];
  }[];
  education?: {
    institution: string;
    degree?: string | null;
    fieldOfStudy?: string | null;
    startDate: string | Date;
    endDate?: string | Date | null;
    grade?: string | null;
  }[];
  skills?: { name: string; proficiency: number; category?: string }[];
  certifications?: { name: string; organization: string; issueDate: string | Date }[];
  languages?: { language: string; proficiency: string }[];
}

const COMMON_KEYWORDS = [
  "javascript", "typescript", "react", "next.js", "node.js", "python", "java",
  "aws", "docker", "kubernetes", "sql", "nosql", "api", "rest", "graphql",
  "agile", "scrum", "leadership", "team", "communication", "problem-solving",
  "full-stack", "frontend", "backend", "devops", "ci/cd", "testing",
  "microservices", "architecture", "design", "database", "cloud",
];

export function calculateATSScore(resume: ResumeData): ATSResult {
  const sections: ATSResult["sections"] = [];
  const allTips: string[] = [];

  // 1. Contact Information
  let contactScore = 0;
  const contactTips: string[] = [];
  if (resume.fullName) contactScore += 15;
  else contactTips.push("Add your full name");
  if (resume.email) contactScore += 15;
  else contactTips.push("Add an email address");
  if (resume.phone) contactScore += 10;
  else contactTips.push("Add a phone number");
  if (resume.location) contactScore += 10;
  else contactTips.push("Add your location");
  if (resume.website || (resume.socialLinks && resume.socialLinks.length > 0)) contactScore += 10;
  else contactTips.push("Add a website or social links");
  sections.push({ name: "Contact Information", score: contactScore, maxScore: 60, tips: contactTips });

  // 2. Professional Summary
  let summaryScore = 0;
  const summaryTips: string[] = [];
  if (resume.summary) {
    summaryScore += 20;
    const wordCount = resume.summary.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 200) summaryScore += 20;
    else summaryTips.push("Summary should be 50-200 words (currently " + wordCount + ")");
    const keywordMatches = COMMON_KEYWORDS.filter(k => resume.summary!.toLowerCase().includes(k));
    if (keywordMatches.length >= 3) summaryScore += 10;
    else summaryTips.push("Include more industry keywords in your summary");
  } else {
    summaryTips.push("Add a professional summary");
  }
  sections.push({ name: "Professional Summary", score: summaryScore, maxScore: 50, tips: summaryTips });

  // 3. Work Experience
  let expScore = 0;
  const expTips: string[] = [];
  if (resume.experiences && resume.experiences.length > 0) {
    expScore += 15;
    const hasRecent = resume.experiences.some(e => e.current || (e.endDate && new Date(e.endDate).getFullYear() >= new Date().getFullYear() - 2));
    if (hasRecent) expScore += 10;
    else expTips.push("Add recent work experience (within last 2 years)");
    const hasMetrics = resume.experiences.some(e => e.achievements && e.achievements.length > 0);
    if (hasMetrics) expScore += 10;
    else expTips.push("Add achievements/metrics to your experience entries");
    if (resume.experiences.length >= 2) expScore += 10;
    else expTips.push("Add at least 2 work experiences");
    const hasTech = resume.experiences.some(e => e.technologies && e.technologies.length > 0);
    if (hasTech) expScore += 10;
    else expTips.push("List technologies used in each role");
  } else {
    expTips.push("Add work experience");
  }
  sections.push({ name: "Work Experience", score: expScore, maxScore: 55, tips: expTips });

  // 4. Education
  let eduScore = 0;
  const eduTips: string[] = [];
  if (resume.education && resume.education.length > 0) {
    eduScore += 20;
    if (resume.education.some(e => e.degree)) eduScore += 10;
    else eduTips.push("Add degree information");
    if (resume.education.some(e => e.grade)) eduScore += 5;
  } else {
    eduTips.push("Add education information");
  }
  sections.push({ name: "Education", score: eduScore, maxScore: 35, tips: eduTips });

  // 5. Skills
  let skillScore = 0;
  const skillTips: string[] = [];
  if (resume.skills && resume.skills.length > 0) {
    skillScore += 10;
    if (resume.skills.length >= 10) skillScore += 10;
    else skillTips.push("List at least 10 skills");
    const categories = new Set(resume.skills.map(s => s.category).filter(Boolean));
    if (categories.size >= 3) skillScore += 10;
    else skillTips.push("Include skills from at least 3 categories (e.g., Frontend, Backend, Database)");
  } else {
    skillTips.push("Add skills");
  }
  sections.push({ name: "Skills", score: skillScore, maxScore: 30, tips: skillTips });

  // 6. Certifications
  let certScore = 0;
  const certTips: string[] = [];
  if (resume.certifications && resume.certifications.length > 0) {
    certScore += 15;
  } else {
    certTips.push("Consider adding certifications to boost your profile");
  }
  sections.push({ name: "Certifications", score: certScore, maxScore: 15, tips: certTips });

  // 7. Keyword Analysis
  let keywordScore = 0;
  const keywordTips: string[] = [];
  const allText = [
    resume.summary || "",
    resume.professionalTitle || "",
    ...(resume.skills || []).map(s => s.name),
    ...(resume.experiences || []).flatMap(e => [...(e.jobTitle || ""), ...(e.technologies || [])]),
    ...(resume.specializations || []),
  ].join(" ").toLowerCase();
  const matchedKeywords = COMMON_KEYWORDS.filter(k => allText.includes(k));
  keywordScore = Math.min(Math.round((matchedKeywords.length / COMMON_KEYWORDS.length) * 30), 30);
  if (matchedKeywords.length < 5) keywordTips.push("Include more industry keywords throughout your resume");
  sections.push({ name: "Keyword Optimization", score: keywordScore, maxScore: 30, tips: keywordTips });

  // Overall
  const totalScore = sections.reduce((s, sec) => s + sec.score, 0);
  const totalMax = sections.reduce((s, sec) => s + sec.maxScore, 0);
  const overall = Math.round((totalScore / totalMax) * 100);

  return { overall, sections, tips: allTips };
}
