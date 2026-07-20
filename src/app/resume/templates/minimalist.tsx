import { getTranslations } from "next-intl/server";
import { DownloadButton } from "../DownloadButton";
import { ShareButton } from "@/components/resume/ShareButton";
import {
  Award,
  ExternalLink,
  Download
} from "lucide-react";
import Image from "next/image";
import {
  formatDate
} from "./types";
import { ResumeSectionTracker } from "@/components/resume/ResumeSectionTracker";
import type { TemplateProps, Skill, Experience, Education, Certification, Reference, ResumeAward, Language } from "@/app/resume/templates/types";

export async function MinimalistTemplate({
  resume,
  experiences,
  education,
  skills,
  certifications,
  awards,
  languages,
  references,
  featuredProjects,
  visibility,
}: TemplateProps) {
  const t = await getTranslations("resume.templates");
  const accentColor = "text-rose-500 dark:text-rose-400";

  const templates = [
    { id: "minimalist", label: "Minimalist" },
    { id: "modern", label: "Modern" },
    { id: "corporate", label: "Corporate" },
    { id: "developer", label: "Developer" },
    { id: "executive", label: "Executive" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        {/* Hero */}
        <div className="text-center">
          {resume.photo && (
            <div className="mx-auto mb-8 h-20 w-20 overflow-hidden rounded-full">
              <Image
                src={resume.photo}
                alt={resume.fullName ?? ""}
                width={80}
                height={80}
                className="h-full w-full object-cover grayscale"
                unoptimized
              />
            </div>
          )}
          <h1 className="text-4xl font-light tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            {resume.fullName}
          </h1>
          <p className={`mt-3 text-lg font-medium ${accentColor}`}>
            {resume.professionalTitle}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            {resume.location && <span>{resume.location}</span>}
            {resume.email && <span>{resume.email}</span>}
            {resume.phone && <span>{resume.phone}</span>}
            {resume.yearsOfExperience != null && <span>{t("yearsOfExperience", { years: resume.yearsOfExperience })}</span>}
          </div>
          {resume.website && (
            <a
              href={resume.website}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-2 inline-block text-sm ${accentColor} hover:underline`}
            >
              {resume.website.replace(/https?:\/\//, "")}
            </a>
          )}
          {resume.socialLinks.length > 0 && (
            <div className="mt-4 flex items-center justify-center gap-4">
              {resume.socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {link.label || link.url.replace(/https?:\/\//, "")}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 mx-auto w-12 h-0.5 bg-zinc-300 dark:bg-zinc-700" />

        {/* Actions */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <ShareButton className="border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-muted-foreground" />
          <DownloadButton
            template={resume.template}
            label={t("downloadResume")}
            variant="default"
            className="bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg hover:from-brand-500 hover:to-brand-600 hover:shadow-blue-500/25"
          />
        </div>

        {/* Summary */}
        {resume.summary && visibility.summary !== false && (
          <ResumeSectionTracker section="summary">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-4`}>
              {resume.summaryTitle || t("about")}
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground dark:text-zinc-400">
              {resume.summary}
            </p>
            {resume.specializations?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {resume.specializations.map((spec, i) => (
                  <span key={i} className="text-sm text-zinc-500 dark:text-zinc-400">
                    {i > 0 && <span className="mr-1">/</span>}
                    {spec}
                  </span>
                ))}
              </div>
            )}
          </section>
          </ResumeSectionTracker>
        )}

        {/* Experience */}
        {experiences.length > 0 && visibility.experience !== false && (
          <ResumeSectionTracker section="experience">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-8`}>
              {t("experience")}
            </h2>
            <div className="space-y-10">
              {experiences.map((exp: Experience) => {
                const responsibilities = (exp.responsibilities as string[]) ?? [];
                const achievements = (exp.achievements as string[]) ?? [];
                const technologies = (exp.technologies as string[]) ?? [];
                return (
                  <div key={exp.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{exp.jobTitle}</h3>
                        <p className={`text-sm font-medium ${accentColor}`}>{exp.company}</p>
                      </div>
                      <span className="text-sm text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {formatDate(exp.startDate)} – {exp.current ? t("present") : exp.endDate ? formatDate(exp.endDate) : ""}
                      </span>
                    </div>
                    {exp.location && (
                      <p className="mt-1 text-sm text-zinc-400">{exp.location}</p>
                    )}
                    {responsibilities.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {responsibilities.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground dark:text-zinc-400 pl-4">
                            {r}
                          </li>
                        ))}
                      </ul>
                    )}
                    {achievements.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs font-medium text-zinc-500 mb-1">{t("keyAchievements")}</p>
                        {achievements.map((a: string, i: number) => (
                          <p key={i} className="text-sm text-muted-foreground dark:text-zinc-400">{a}</p>
                        ))}
                      </div>
                    )}
                    {technologies.length > 0 && (
                      <p className="mt-2 text-sm text-zinc-400">
                        {technologies.join(", ")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Education */}
        {education.length > 0 && visibility.education !== false && (
          <ResumeSectionTracker section="education">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-8`}>
              {t("education")}
            </h2>
            <div className="space-y-6">
              {education.map((edu: Education) => (
                <div key={edu.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-medium text-zinc-900 dark:text-white">{edu.institution}</h3>
                      <p className="text-sm text-muted-foreground dark:text-zinc-400">
                        {edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ""}
                      </p>
                    </div>
                    <span className="text-sm text-zinc-400">
                      {formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : t("present")}
                    </span>
                  </div>
                  {edu.grade && <p className="mt-1 text-sm text-zinc-400">{t("gpa")}{edu.grade}</p>}
                  {edu.description && <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Skills */}
        {skills.length > 0 && visibility.skills !== false && (
          <ResumeSectionTracker section="skills">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-6`}>
              {t("skills")}
            </h2>
            <div className="space-y-6">
              {(() => {
                const grouped = skills.reduce(
                  (acc: Record<string, Skill[]>, skill: Skill) => {
                    const cat = skill.category || "Other";
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(skill);
                    return acc;
                  },
                  {} as Record<string, Skill[]>,
                );
                return Object.entries(grouped).map(([category, categorySkills]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">{category}</p>
                    <p className="text-sm text-muted-foreground dark:text-zinc-400 leading-relaxed">
                      {categorySkills.map((s: Skill) => s.name).join(", ")}
                    </p>
                  </div>
                ));
              })()}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Certifications */}
        {certifications.length > 0 && visibility.certifications !== false && (
          <ResumeSectionTracker section="certifications">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-6`}>
              {t("certifications")}
            </h2>
            <div className="space-y-4">
              {certifications.map((cert: Certification) => (
                <div key={cert.id} className="flex items-start gap-3">
                  <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{cert.name}</p>
                    <p className="text-sm text-zinc-500">{cert.organization} &middot; {formatDate(cert.issueDate)}</p>
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className={`text-sm ${accentColor} hover:underline inline-flex items-center gap-1 mt-0.5`}>
                        <ExternalLink className="h-3 w-3" />
                        {t("verify")}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Awards */}
        {awards.length > 0 && visibility.awards !== false && (
          <ResumeSectionTracker section="awards">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-6`}>
              {t("awards")}
            </h2>
            <div className="space-y-4">
              {awards.map((award: ResumeAward) => (
                <div key={award.id} className="flex items-start gap-3">
                  <Award className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{award.title}</p>
                    <p className="text-sm text-zinc-500">
                      {[award.organization, award.date ? formatDate(award.date) : null].filter(Boolean).join(" • ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Languages */}
        {languages.length > 0 && visibility.languages !== false && (
          <ResumeSectionTracker section="languages">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-6`}>
              {t("languages")}
            </h2>
            <p className="text-sm text-muted-foreground dark:text-zinc-400">
              {languages.map((l: Language) => `${l.language} (${l.proficiency})`).join(", ")}
            </p>
          </section>
          </ResumeSectionTracker>
        )}

        {/* References */}
        {references.length > 0 && visibility.references !== false && (
          <ResumeSectionTracker section="references">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-6`}>
              {t("references")}
            </h2>
            <div className="space-y-4">
              {references.map((ref: Reference) => (
                <div key={ref.id}>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">{ref.name}</p>
                  <p className="text-sm text-zinc-500">
                    {[ref.position, ref.organization].filter(Boolean).join(" at ")}
                  </p>
                  {(ref.email || ref.phone) && (
                    <p className="text-sm text-zinc-400">
                      {ref.email}{ref.email && ref.phone ? " • " : ""}{ref.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Featured Projects */}
        {featuredProjects.length > 0 && visibility.featuredProjects !== false && (
          <ResumeSectionTracker section="featuredProjects">
          <section className="mt-16">
            <h2 className={`text-sm font-semibold uppercase tracking-widest ${accentColor} mb-6`}>
              {t("featuredProjects")}
            </h2>
            <div className="space-y-4">
              {featuredProjects.slice(0, 3).map((fp: FeaturedProject) => {
                const project = fp.project;
                return (
                  <div key={fp.id}>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{project.title}</p>
                    <p className="text-sm text-zinc-500">{project.category?.name || t("project")}</p>
                    {project.shortDescription && (
                      <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1">{project.shortDescription}</p>
                    )}
                    {project.technologies?.length > 0 && (
                      <p className="text-sm text-zinc-400 mt-1">{project.technologies.map((t: { id: string; name: string }) => t.name).join(", ")}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Download */}
        <section className="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Download className="h-4 w-4" />
              <span className="text-sm">{t("printToPdf")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <DownloadButton
                  key={t.id}
                  template={t.id}
                  label={t.label}
                  variant={t.id === resume.template ? "default" : "outline"}
                  className={t.id === resume.template ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : ""}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm">{t("downloadPdf")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <DownloadButton
                  key={`pdf-${t.id}`}
                  template={t.id}
                  label={t.label}
                  variant="outline"
                  mode="pdf"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
