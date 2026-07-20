import { getTranslations } from "next-intl/server";
import { DownloadButton } from "../DownloadButton";
import { ShareButton } from "@/components/resume/ShareButton";
import { MapPin, Mail, Phone, Globe, Calendar, Award, ExternalLink, Quote, Terminal } from "lucide-react";
import Image from "next/image";
import {
  formatDate
} from "./types";
import { ResumeSectionTracker } from "@/components/resume/ResumeSectionTracker";
import type { TemplateProps, Skill, Experience, Education, Certification, Reference, ResumeAward, Language, FeaturedProject } from "@/app/resume/templates/types";

const GRADIENT_CLASSES = [
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-indigo-500 to-blue-500",
  "from-red-500 to-pink-500",
];

export async function DeveloperTemplate({
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
  const templates = [
    { id: "developer", label: "Developer" },
    { id: "modern", label: "Modern" },
    { id: "corporate", label: "Corporate" },
    { id: "minimalist", label: "Minimalist" },
    { id: "executive", label: "Executive" },
  ];

  return (
    <div className="bg-zinc-950 text-zinc-100">
      {/* Matrix-style background pattern */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(rgba(0, 255, 65, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 65, 0.07) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="pointer-events-none absolute -right-40 -top-40 h-[400px] w-[400px] rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col items-center text-center">
            {resume.photo && (
              <div className="mb-6 h-24 w-24 overflow-hidden rounded-full border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/10">
                <Image src={resume.photo} alt={resume.fullName ?? ""} width={96} height={96} className="h-full w-full object-cover grayscale" unoptimized />
              </div>
            )}
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                {resume.fullName}
              </span>
            </h1>
            <p className="mt-2 text-lg text-zinc-400 font-mono">
              <span className="text-emerald-400">$</span> {resume.professionalTitle?.toLowerCase().replace(/\s+/g, "-")} --role
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-500 font-mono">
              {resume.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                  {resume.location}
                </span>
              )}
              {resume.yearsOfExperience != null && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                  {t("yearsOfExperience", { years: resume.yearsOfExperience })}
                </span>
              )}
              {resume.email && (
                <a href={`mailto:${resume.email}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-cyan-400">
                  <Mail className="h-3.5 w-3.5 text-cyan-500" />
                  {resume.email}
                </a>
              )}
              {resume.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-cyan-500" />
                  {resume.phone}
                </span>
              )}
              {resume.website && (
                <a href={resume.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-cyan-400">
                  <Globe className="h-3.5 w-3.5 text-cyan-500" />
                  {resume.website.replace(/https?:\/\//, "")}
                </a>
              )}
            </div>
            {resume.socialLinks.length > 0 && (
              <div className="mt-4 flex items-center gap-4">
                {resume.socialLinks.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors font-mono">
                    [{link.label || link.url.replace(/https?:\/\//, "")}]
                  </a>
                ))}
              </div>
            )}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <ShareButton className="border-zinc-700 text-muted-foreground hover:bg-zinc-800 hover:text-cyan-400" />
              <DownloadButton template={resume.template} label={t("download")} variant="default" className="bg-cyan-600 text-white hover:bg-cyan-500" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Summary */}
        {resume.summary && visibility.summary !== false && (
          <ResumeSectionTracker section="summary">
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-4">
              <span className="text-muted-foreground">{"// "}</span> {resume.summaryTitle || t("about")}
            </h2>
            <p className="text-base leading-relaxed text-zinc-400 max-w-3xl">
              {resume.summary}
            </p>
            {resume.specializations?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {resume.specializations.map((spec, i) => (
                  <span key={i} className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
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
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-8">
              <span className="text-muted-foreground">{"// "}</span> {t("experience")}
            </h2>
            <div className="relative">
              <div className="absolute left-[11px] top-0 h-full w-0.5 bg-gradient-to-b from-cyan-500/50 to-transparent" />
              <div className="space-y-10">
                {experiences.map((exp: Experience, _index: number) => {
                  const responsibilities = (exp.responsibilities as string[]) ?? [];
                  const achievements = (exp.achievements as string[]) ?? [];
                  const technologies = (exp.technologies as string[]) ?? [];
                  return (
                    <div key={exp.id} className="relative pl-10">
                      <div className="absolute left-[4px] top-1.5 h-4 w-4">
                        <div className="h-full w-full rounded-full bg-zinc-950 border-2 border-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.3)]" />
                        <div className="absolute inset-1 rounded-full bg-cyan-500 animate-pulse" />
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-surface p-6">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-zinc-100">{exp.jobTitle}</h3>
                            <p className="text-sm text-cyan-400">{exp.company}</p>
                          </div>
                          <span className="text-xs font-mono text-zinc-500">
                            {/* {formatDate(exp.startDate)} – {exp.current ? "present" : exp.endDate ? formatDate(exp.endDate) : ""} */}
                            <span className="text-emerald-500">[</span>
                            {formatDate(exp.startDate)}
                            <span className="text-muted-foreground"> .. </span>
                            {exp.current ? t("present") : exp.endDate ? formatDate(exp.endDate) : ""}
                            <span className="text-emerald-500">]</span>
                          </span>
                        </div>
                        {exp.location && (
                          <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exp.location}
                          </p>
                        )}
                        {responsibilities.length > 0 && (
                          <ul className="mt-4 space-y-1.5">
                            {responsibilities.map((r: string, i: number) => (
                              <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                                <span className="mt-1.5 block h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        )}
                        {achievements.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-mono text-amber-500 mb-1">{t("achievements")}</p>
                            <ul className="space-y-1">
                              {achievements.map((a: string, i: number) => (
                                <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                                  <Award className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {technologies.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {technologies.map((t: string, i: number) => (
                              <span key={i} className="text-xs font-mono px-2 py-0.5 rounded border border-zinc-700 text-zinc-400 bg-zinc-800/50">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Skills */}
        {skills.length > 0 && visibility.skills !== false && (
          <ResumeSectionTracker section="skills">
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-6">
              <span className="text-muted-foreground">{"// "}</span> {t("skills")}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
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
                let skillIdx = 0;
                return Object.entries(grouped).map(([category, categorySkills]) => {
                  const section = (
                    <div key={category} className="rounded-lg border border-zinc-800 bg-surface p-5">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">{category}</h3>
                      <div className="space-y-3">
                        {categorySkills.map((skill: Skill) => {
                          const gradient = GRADIENT_CLASSES[skillIdx++ % GRADIENT_CLASSES.length];
                          return (
                            <div key={skill.id}>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{skill.name}</span>
                                <span className="text-xs text-zinc-500">
                                  {skill.proficiency}%
                                  {skill.yearsOfExperience != null && <span className="ml-1">| {skill.yearsOfExperience}y</span>}
                                </span>
                              </div>
                              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                                <div
                                  className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all`}
                                  style={{ width: `${skill.proficiency}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                  return section;
                });
              })()}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Education */}
        {education.length > 0 && visibility.education !== false && (
          <ResumeSectionTracker section="education">
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-6">
              <span className="text-muted-foreground">{"// "}</span> {t("education")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {education.map((edu: Education) => (
                <div key={edu.id} className="rounded-lg border border-zinc-800 bg-surface p-5">
                  <h3 className="text-sm font-semibold text-zinc-100">{edu.institution}</h3>
                  <p className="text-sm text-cyan-400 mt-0.5">
                    {edu.degree}{edu.fieldOfStudy ? ` / ${edu.fieldOfStudy}` : ""}
                  </p>
                  <p className="text-xs font-mono text-zinc-500 mt-2">
                    <span className="text-emerald-500">[</span>
                    {formatDate(edu.startDate)}
                    <span className="text-muted-foreground"> .. </span>
                    {edu.endDate ? formatDate(edu.endDate) : t("present")}
                    <span className="text-emerald-500">]</span>
                  </p>
                  {edu.grade && <p className="text-xs text-zinc-500 mt-1">{t("grade")}{edu.grade}</p>}
                  {edu.description && <p className="text-sm text-zinc-400 mt-2">{edu.description}</p>}
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Certifications */}
        {certifications.length > 0 && visibility.certifications !== false && (
          <ResumeSectionTracker section="certifications">
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-6">
              <span className="text-muted-foreground">{"// "}</span> {t("certifications")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert: Certification) => (
                <div key={cert.id} className="rounded-lg border border-zinc-800 bg-surface p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{cert.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{cert.organization}</p>
                    </div>
                    <Terminal className="h-4 w-4 text-cyan-500 flex-shrink-0" />
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mt-3">{formatDate(cert.issueDate)}</p>
                  {cert.credentialUrl && (
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      {t("verify")}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Awards */}
        {awards.length > 0 && visibility.awards !== false && (
          <ResumeSectionTracker section="awards">
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-6">
              <span className="text-muted-foreground">{"// "}</span> {t("awards")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {awards.map((award: ResumeAward) => (
                <div key={award.id} className="flex items-start gap-3 rounded-lg border border-zinc-800 bg-surface p-4">
                  <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-100">{award.title}</p>
                    <p className="text-xs text-zinc-500">{award.organization}{award.date ? ` • ${formatDate(award.date)}` : ""}</p>
                    {award.description && <p className="text-sm text-zinc-400 mt-1">{award.description}</p>}
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
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-6">
              <span className="text-muted-foreground">{"// "}</span> {t("languages")}
            </h2>
            <div className="flex flex-wrap gap-3">
              {languages.map((lang: Language) => (
                <div key={lang.id} className="rounded-lg border border-zinc-800 bg-surface px-4 py-2">
                  <span className="text-sm text-muted-foreground">{lang.language}</span>
                  <span className="text-xs text-muted-foreground ml-2">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* References */}
        {references.length > 0 && visibility.references !== false && (
          <ResumeSectionTracker section="references">
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-6">
              <span className="text-muted-foreground">{"// "}</span> {t("references")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {references.map((ref: Reference) => (
                <div key={ref.id} className="rounded-lg border border-zinc-800 bg-surface p-5">
                  <Quote className="h-4 w-4 text-zinc-700 mb-2" />
                  <p className="text-sm font-semibold text-zinc-100">{ref.name}</p>
                  <p className="text-xs text-zinc-500">
                    {[ref.position, ref.organization].filter(Boolean).join(" at ")}
                  </p>
                  {(ref.email || ref.phone) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {ref.email}{ref.email && ref.phone ? " | " : ""}{ref.phone}
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
          <section className="mb-16">
            <h2 className="text-sm font-mono text-emerald-400 mb-6">
              <span className="text-muted-foreground">{"// "}</span> {t("projects")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.slice(0, 3).map((fp: FeaturedProject) => {
                const project = fp.project;
                return (
                  <div key={fp.id} className="rounded-lg border border-zinc-800 bg-surface p-5">
                    <p className="text-xs text-cyan-400 mb-1">{project.category?.name || t("project")}</p>
                    <h3 className="text-sm font-semibold text-zinc-100">{project.title}</h3>
                    {project.shortDescription && (
                      <p className="text-xs text-zinc-500 mt-2">{project.shortDescription}</p>
                    )}
                    {project.technologies?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {project.technologies.map((tech: { id: string; name: string }) => (
                          <span key={tech.id} className="text-xs font-mono text-muted-foreground bg-zinc-800 px-1.5 py-0.5 rounded">
                            {tech.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Download */}
        <section className="pt-8 border-t border-zinc-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-mono text-zinc-500">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <span>{t("downloadList")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <DownloadButton
                  key={t.id}
                  template={t.id}
                  label={t.label}
                  variant={t.id === resume.template ? "default" : "outline"}
                  className={t.id === resume.template ? "bg-cyan-600 text-white hover:bg-cyan-500" : "border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-sm font-mono text-zinc-500">
              <Terminal className="h-4 w-4 text-emerald-500" />
              <span>{t("downloadPdfCommand")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <DownloadButton
                  key={`pdf-${t.id}`}
                  template={t.id}
                  label={t.label}
                  variant="outline"
                  mode="pdf"
                  className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
