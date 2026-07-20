import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/get-site-settings";
import { getTranslations, getLocale } from "next-intl/server";
import type { Metadata } from "next";
import { PrintButton } from "./PrintButton";
import type { Skill, Experience, Education, Certification, Reference, ResumeAward, Language, FeaturedProject } from "@/app/resume/templates/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const resume = await prisma.resumeProfile.findFirst({
      where: { published: true },
    });
    const settings = await getSiteSettings();
    return {
      title: resume?.metaTitle || `Resume | ${settings.siteName}`,
      description: resume?.metaDescription || settings.description,
    };
  } catch {
    const settings = await getSiteSettings();
    return {
      title: `Resume | ${settings.siteName}`,
      description: settings.description,
    };
  }
}

export default async function ResumePrintPage() {
  const t = await getTranslations("resume.print");
  const locale = await getLocale();

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString(locale, { year: "numeric", month: "short" });
  };

  const formatDateFull = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString(locale, { year: "numeric", month: "long" });
  };

  let resume;
  try {
    resume = await prisma.resumeProfile.findFirst({
      where: { published: true },
      include: {
        experiences: { orderBy: { order: "asc" } },
        education: { orderBy: { order: "asc" } },
        skills: { orderBy: { order: "asc" } },
        certifications: { orderBy: { order: "asc" } },
        awards: { orderBy: { order: "asc" } },
        languages: { orderBy: { order: "asc" } },
        references: {
          where: { isPublic: true },
          orderBy: { order: "asc" },
        },
        featuredProjects: {
          orderBy: { order: "asc" },
          include: {
            project: {
              include: {
                technologies: true,
              },
            },
          },
        },
      },
    });
  } catch {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>{t("unavailable")}</h1>
        <p>{t("loadError")}</p>
      </div>
    );
  }

  if (!resume) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>{t("notFound")}</h1>
        <p>{t("notFoundMessage")}</p>
      </div>
    );
  }

  const specializations = (resume.specializations as string[]) ?? [];
  const socialLinks = (resume.socialLinks as Array<{ platform: string; url: string }>) ?? [];

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: "Geist", system-ui, -apple-system, sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #000;
          background: #fff;
          padding: 0.5in;
        }
        @media print {
          @page { margin: 0.5in; size: letter; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          a { text-decoration: none; color: #000; }
          a.no-link::after { content: none; }
          .page-break { page-break-before: always; }
        }
        @media screen {
          .print-wrap { max-width: 8.5in; margin: 0 auto; padding: 0.5in; }
          .print-controls { text-align: center; margin-bottom: 1rem; }
          .print-controls button {
            padding: 0.5rem 1.5rem;
            font-size: 1rem;
            background: #1d4ed8;
            color: #fff;
            border: none;
            border-radius: 0.375rem;
            cursor: pointer;
          }
          .print-controls button:hover { background: #1e40af; }
        }

        .header { text-align: center; margin-bottom: 1.5rem; }
        .header h1 { font-size: 18pt; font-weight: 700; margin-bottom: 0.15in; }
        .header .title { font-size: 12pt; color: #333; margin-bottom: 0.1in; }
        .header .contact { font-size: 10pt; color: #555; }
        .header .contact span { margin: 0 0.1in; }
        .header .social { font-size: 9pt; color: #666; margin-top: 0.05in; }

        .section { margin-top: 0.2in; }
        .section h2 {
          font-size: 13pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1.5pt solid #000;
          padding-bottom: 0.05in;
          margin-bottom: 0.1in;
        }
        .section p, .section li { font-size: 10pt; }

        .specializations { margin: 0.1in 0; }
        .specializations span {
          display: inline-block;
          font-size: 9pt;
          color: #333;
          margin-right: 0.1in;
        }

        .exp-item, .edu-item { margin-bottom: 0.15in; }
        .exp-header, .edu-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .exp-header h3, .edu-header h3 { font-size: 11pt; font-weight: 600; }
        .exp-header .company, .edu-header .institution { font-size: 10pt; font-weight: 500; color: #222; }
        .exp-header .date, .edu-header .date { font-size: 9pt; color: #555; white-space: nowrap; }
        .exp-location { font-size: 9pt; color: #555; }
        .exp-details { margin-top: 0.05in; padding-left: 0.15in; }
        .exp-details ul { list-style: disc; padding-left: 0.15in; }
        .exp-details li { margin-bottom: 0.03in; }
        .exp-tech { font-size: 9pt; color: #444; margin-top: 0.05in; }

        .skills-section { }
        .skill-category { margin-bottom: 0.1in; }
        .skill-category h3 { font-size: 10pt; font-weight: 600; margin-bottom: 0.05in; }
        .skill-list { font-size: 10pt; }
        .skill-item { display: inline; }
        .skill-item::after { content: ", "; }
        .skill-item:last-child::after { content: none; }

        .cert-list { list-style: none; padding: 0; }
        .cert-list li { margin-bottom: 0.08in; font-size: 10pt; }

        .award-list { list-style: none; padding: 0; }
        .award-list li { margin-bottom: 0.08in; font-size: 10pt; }

        .lang-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .lang-table th, .lang-table td { text-align: left; padding: 0.05in 0.1in; border-bottom: 0.5pt solid #ccc; }
        .lang-table th { font-weight: 600; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.05em; }

        .ref-list { list-style: none; padding: 0; }
        .ref-list li { margin-bottom: 0.1in; font-size: 10pt; }
        .ref-list .ref-name { font-weight: 600; }
        .ref-list .ref-detail { color: #444; }

        .projects-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.15in; }
        .proj-item { font-size: 10pt; }
        .proj-item h3 { font-size: 10pt; font-weight: 600; }
        .proj-tech { font-size: 9pt; color: #444; }
      `}</style>
      <div className="print-wrap">
        <div className="no-print print-controls">
          <PrintButton />
        </div>

        <div className="header">
          <h1>{resume.fullName}</h1>
          <p className="title">{resume.professionalTitle}</p>
          <p className="contact">
            {resume.location && <span>{resume.location}</span>}
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>{resume.phone}</span>}
            {resume.website && <span>{resume.website}</span>}
            {resume.yearsOfExperience != null && (
              <span>{t("yearsOfExperience", { years: resume.yearsOfExperience })}</span>
            )}
          </p>
          {socialLinks.length > 0 && (
            <p className="social">
              {socialLinks.map((l, i) => (
                <span key={i}>
                  {i > 0 && " | "}
                  {l.platform || l.url}
                </span>
              ))}
            </p>
          )}
        </div>

        {resume.summary && (
          <div className="section">
            <h2>{resume.summaryTitle || t("professionalSummary")}</h2>
            <p>{resume.summary}</p>
            {specializations.length > 0 && (
              <div className="specializations">
                {specializations.map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {resume.experiences.length > 0 && (
          <div className="section">
            <h2>{t("experience")}</h2>
            {resume.experiences.map((exp) => {
              const responsibilities = (exp.responsibilities as string[]) ?? [];
              const achievements = (exp.achievements as string[]) ?? [];
              const technologies = (exp.technologies as string[]) ?? [];
              return (
                <div key={exp.id} className="exp-item">
                  <div className="exp-header">
                    <div>
                      <h3>{exp.jobTitle}</h3>
                      <span className="company">{exp.company}</span>
                    </div>
                    <span className="date">
                      {formatDate(exp.startDate)} &mdash;{" "}
                      {exp.current ? t("present") : exp.endDate ? formatDate(exp.endDate) : ""}
                    </span>
                  </div>
                  {exp.location && <p className="exp-location">{exp.location}</p>}
                  <div className="exp-details">
                    {responsibilities.length > 0 && (
                      <ul>
                        {responsibilities.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                    {achievements.length > 0 && (
                      <>
                        <p style={{ fontWeight: 600, marginTop: "0.05in", fontSize: "9pt" }}>{t("keyAchievements")}</p>
                        <ul>
                          {achievements.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                  {technologies.length > 0 && (
                    <p className="exp-tech">
                      <strong>{t("technologies")}</strong> {technologies.join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {resume.education.length > 0 && (
          <div className="section">
            <h2>{t("education")}</h2>
            {resume.education.map((edu) => (
              <div key={edu.id} className="edu-item">
                <div className="edu-header">
                  <div>
                    <h3>{edu.degree || t("education")}</h3>
                    <span className="institution">{edu.institution}</span>
                  </div>
                  <span className="date">
                    {formatDate(edu.startDate)} &mdash;{" "}
                    {edu.endDate ? formatDate(edu.endDate) : t("present")}
                  </span>
                </div>
                {edu.fieldOfStudy && <p style={{ fontSize: "10pt", color: "#444" }}>{t("field")} {edu.fieldOfStudy}</p>}
                {edu.grade && <p style={{ fontSize: "10pt", color: "#444" }}>{t("grade")} {edu.grade}</p>}
                {edu.description && <p style={{ fontSize: "10pt", marginTop: "0.03in" }}>{edu.description}</p>}
              </div>
            ))}
          </div>
        )}

        {resume.skills.length > 0 && (
          <div className="section">
            <h2>{t("skills")}</h2>
            <div className="skills-section">
              {(() => {
                const grouped = resume.skills.reduce(
                  (acc, skill) => {
                    const cat = skill.category || "Other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(skill);
                    return acc;
                  },
                  {} as Record<string, typeof resume.skills>,
                );
                return Object.entries(grouped).map(([category, skills]) => (
                  <div key={category} className="skill-category">
                    <h3>{category}</h3>
                    <div className="skill-list">
                      {skills
                        .sort((a, b) => b.proficiency - a.proficiency)
                        .map((_skill, _i) => (
                          <span key={skill.id} className="skill-item">
                            {skill.name} ({skill.proficiency}%
                            {skill.yearsOfExperience != null ? `, ${skill.yearsOfExperience}y` : ""}
                            )
                          </span>
                        ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {resume.certifications.length > 0 && (
          <div className="section">
            <h2>{t("certifications")}</h2>
            <ul className="cert-list">
              {resume.certifications.map((cert) => (
                <li key={cert.id}>
                  <strong>{cert.name}</strong> &mdash; {cert.organization}
                  &nbsp;({formatDateFull(cert.issueDate)}
                  {cert.expiryDate ? ` - ${formatDateFull(cert.expiryDate)}` : ""})
                  {cert.credentialUrl && <> | {cert.credentialUrl}</>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resume.featuredProjects.length > 0 && (
          <div className="section">
            <h2>{t("featuredProjects")}</h2>
            <div className="projects-grid">
              {resume.featuredProjects.slice(0, 3).map((fp) => {
                const project = fp.project;
                return (
                  <div key={fp.id} className="proj-item">
                    <h3>{project.title}</h3>
                    {project.shortDescription && <p>{project.shortDescription}</p>}
                    {project.technologies.length > 0 && (
                      <p className="proj-tech">
                        <strong>{t("tech")}</strong> {project.technologies.map((tech) => tech.name).join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {resume.awards.length > 0 && (
          <div className="section">
            <h2>{t("awards")}</h2>
            <ul className="award-list">
              {resume.awards.map((award) => (
                <li key={award.id}>
                  <strong>{award.title}</strong>
                  {award.organization && <> &mdash; {award.organization}</>}
                  {award.date && <> ({formatDateFull(award.date)})</>}
                  {award.description && <p style={{ fontSize: "10pt", color: "#444" }}>{award.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resume.languages.length > 0 && (
          <div className="section">
            <h2>{t("languages")}</h2>
            <table className="lang-table">
              <thead>
                <tr>
                  <th>{t("language")}</th>
                  <th>{t("proficiency")}</th>
                </tr>
              </thead>
              <tbody>
                {resume.languages.map((lang) => (
                  <tr key={lang.id}>
                    <td style={{ fontWeight: 500 }}>{lang.language}</td>
                    <td>{lang.proficiency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {resume.references.length > 0 && (
          <div className="section">
            <h2>{t("references")}</h2>
            <ul className="ref-list">
              {resume.references.map((ref) => (
                <li key={ref.id}>
                  <span className="ref-name">{ref.name}</span>
                  {ref.position && <>, {ref.position}</>}
                  {ref.organization && <> at {ref.organization}</>}
                  <div className="ref-detail">
                    {ref.email && <div>{ref.email}</div>}
                    {ref.phone && <div>{ref.phone}</div>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
