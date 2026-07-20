import { getTranslations } from "next-intl/server";
import { DownloadButton } from "../DownloadButton";
import { ShareButton } from "@/components/resume/ShareButton";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Calendar,
  Award,
  CheckCircle2,
  ExternalLink,
  Download,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
} from "@/components/ui/card";
import { type TemplateProps, type Experience, type Skill, type Education, type Certification, type ResumeAward, type Language, type Reference, type FeaturedProject, formatDate } from "./types";
import { ResumeSectionTracker } from "@/components/resume/ResumeSectionTracker";

export async function CorporateTemplate({
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
  const groupedSkills = skills.reduce(
    (acc: Record<string, Skill[]>, skill: Skill) => {
      const cat = skill.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {} as Record<string, Skill[]>,
  );

  const templates = [
    { id: "corporate", label: "Corporate" },
    { id: "modern", label: "Modern" },
    { id: "minimalist", label: "Minimalist" },
    { id: "developer", label: "Developer" },
    { id: "executive", label: "Executive" },
  ];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950">
      {/* Hero */}
      <section className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              {resume.photo && (
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-zinc-200 dark:border-zinc-700">
                  <Image
                    src={resume.photo}
                    alt={resume.fullName ?? ""}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                  {resume.fullName}
                </h1>
                <p className="mt-1 text-lg font-medium text-blue-700 dark:text-blue-400">
                  {resume.professionalTitle}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {resume.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {resume.location}
                    </span>
                  )}
                  {resume.email && (
                    <a href={`mailto:${resume.email}`} className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-400">
                      <Mail className="h-3.5 w-3.5" />
                      {resume.email}
                    </a>
                  )}
                  {resume.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {resume.phone}
                    </span>
                  )}
                  {resume.website && (
                    <a href={resume.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-400">
                      <Globe className="h-3.5 w-3.5" />
                      {t("website")}
                    </a>
                  )}
                  {resume.yearsOfExperience != null && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {t("yearsOfExperience", { years: resume.yearsOfExperience })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ShareButton className="border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-muted-foreground" />
              <DownloadButton
                template={resume.template}
                label={t("download")}
                variant="default"
                className="bg-blue-700 text-white hover:bg-blue-800"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content - 70% */}
          <main className="lg:w-[70%] min-w-0">
            {resume.summary && visibility.summary !== false && (
              <ResumeSectionTracker section="summary">
              <section className="mb-12">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white border-b-2 border-blue-700 dark:border-blue-500 pb-2 mb-4">
                  {resume.summaryTitle || t("executiveSummary")}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                  {resume.summary}
                </p>
                {resume.specializations?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {resume.specializations.map((spec, i) => (
                      <Badge key={i} variant="outline" className="text-xs rounded-none border-zinc-300 dark:border-zinc-600">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>
              </ResumeSectionTracker>
            )}

            {experiences.length > 0 && visibility.experience !== false && (
              <ResumeSectionTracker section="experience">
              <section className="mb-12">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white border-b-2 border-blue-700 dark:border-blue-500 pb-2 mb-6">
                  {t("experience")}
                </h2>
                <div className="space-y-8">
                  {experiences.map((exp: Experience) => {
                    const responsibilities = (exp.responsibilities as string[]) ?? [];
                    const achievements = (exp.achievements as string[]) ?? [];
                    const technologies = (exp.technologies as string[]) ?? [];
                    return (
                      <div key={exp.id}>
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{exp.jobTitle}</h3>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">{exp.company}</p>
                          </div>
                          <span className="text-xs text-zinc-500 whitespace-nowrap">
                            {formatDate(exp.startDate)} &mdash; {exp.current ? t("present") : exp.endDate ? formatDate(exp.endDate) : ""}
                          </span>
                        </div>
                        {exp.location && (
                          <p className="mt-1 text-xs text-zinc-500">
                            <MapPin className="inline h-3 w-3 mr-1" />
                            {exp.location}
                          </p>
                        )}
                        {responsibilities.length > 0 && (
                          <ul className="mt-3 space-y-1.5">
                            {responsibilities.map((r: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground dark:text-zinc-400 flex items-start gap-2">
                                <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-blue-700 dark:bg-blue-400" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        )}
                        {achievements.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">{t("keyAchievements")}</p>
                            <ul className="space-y-1">
                              {achievements.map((a: string, i: number) => (
                                <li key={i} className="text-sm text-muted-foreground dark:text-zinc-400 flex items-start gap-2">
                                  <Award className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                                  {a}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {technologies.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {technologies.map((t: string, i: number) => (
                              <span key={i} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5">{t}</span>
                            ))}
                          </div>
                        )}
                        <hr className="mt-6 border-zinc-200 dark:border-zinc-800" />
                      </div>
                    );
                  })}
                </div>
              </section>
              </ResumeSectionTracker>
            )}

            {education.length > 0 && visibility.education !== false && (
              <ResumeSectionTracker section="education">
              <section className="mb-12">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white border-b-2 border-blue-700 dark:border-blue-500 pb-2 mb-6">
                  {t("education")}
                </h2>
                <div className="space-y-6">
                  {education.map((edu: Education) => (
                    <div key={edu.id}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{edu.institution}</h3>
                          <p className="text-sm text-muted-foreground dark:text-zinc-400">
                            {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-500 whitespace-nowrap">
                          {formatDate(edu.startDate)} &mdash; {edu.endDate ? formatDate(edu.endDate) : t("present")}
                        </span>
                      </div>
                      {edu.grade && <p className="mt-1 text-xs text-zinc-500">{t("grade")}{edu.grade}</p>}
                      {edu.description && <p className="mt-2 text-sm text-muted-foreground dark:text-zinc-400">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              </section>
              </ResumeSectionTracker>
            )}

            {certifications.length > 0 && visibility.certifications !== false && (
              <ResumeSectionTracker section="certifications">
              <section className="mb-12">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white border-b-2 border-blue-700 dark:border-blue-500 pb-2 mb-6">
                  {t("certifications")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {certifications.map((cert: Certification) => (
                    <div key={cert.id} className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{cert.name}</p>
                        <p className="text-xs text-zinc-500">{cert.organization}</p>
                        <p className="text-xs text-zinc-400 mt-1">{t("issued")}{formatDate(cert.issueDate)}</p>
                        {cert.credentialUrl && (
                          <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 hover:underline">
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

            {awards.length > 0 && visibility.awards !== false && (
              <ResumeSectionTracker section="awards">
                <section className="mb-12">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white border-b-2 border-blue-700 dark:border-blue-500 pb-2 mb-6">
                    {t("awards")}
                  </h2>
                  <div className="space-y-4">
                    {awards.map((award: ResumeAward) => (
                      <div key={award.id} className="flex items-start gap-3">
                        <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                        <div>
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{award.title}</p>
                          <p className="text-xs text-zinc-500">
                            {[award.organization, award.date ? formatDate(award.date) : null].filter(Boolean).join(" • ")}
                          </p>
                          {award.description && <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1">{award.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </ResumeSectionTracker>
            )}

            {featuredProjects.length > 0 && visibility.featuredProjects !== false && (
              <ResumeSectionTracker section="featuredProjects">
              <section className="mb-12">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white border-b-2 border-blue-700 dark:border-blue-500 pb-2 mb-6">
                  {t("featuredProjects")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {featuredProjects.slice(0, 3).map((fp: FeaturedProject) => {
                    const project = fp.project;
                    return (
                      <div key={fp.id} className="border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{project.title}</p>
                        <p className="text-xs text-zinc-500 mt-1">{project.category?.name || t("project")}</p>
                        {project.shortDescription && <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-2">{project.shortDescription}</p>}
                        {project.technologies?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {project.technologies.slice(0, 4).map((tech: { id: string; name: string }) => (
                              <span key={tech.id} className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5">{tech.name}</span>
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
          </main>

          {/* Sidebar - 30% */}
          <aside className="lg:w-[30%] min-w-0">
            <div className="space-y-8">
              {resume.email || resume.phone || resume.location || resume.website ? (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">{t("contact")}</h3>
                  <div className="space-y-2">
                    {resume.location && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground dark:text-zinc-400">
                        <MapPin className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                        {resume.location}
                      </p>
                    )}
                    {resume.email && (
                      <a href={`mailto:${resume.email}`} className="flex items-center gap-2 text-sm text-muted-foreground dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400">
                        <Mail className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                        {resume.email}
                      </a>
                    )}
                    {resume.phone && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground dark:text-zinc-400">
                        <Phone className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                        {resume.phone}
                      </p>
                    )}
                    {resume.website && (
                      <a href={resume.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground dark:text-zinc-400 hover:text-blue-700 dark:hover:text-blue-400">
                        <Globe className="h-4 w-4 flex-shrink-0 text-blue-700 dark:text-blue-400" />
                        {resume.website.replace(/https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                  {resume.socialLinks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {resume.socialLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 dark:text-blue-400 hover:underline">
                          {link.label || link.url.replace(/https?:\/\//, "")}
                        </a>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {skills.length > 0 && visibility.skills !== false && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">{t("skills")}</h3>
                  {Object.entries(groupedSkills).map(([category, categorySkills]: [string, Skill[]]) => (
                    <div key={category} className="mb-4">
                      <p className="text-xs font-semibold text-zinc-700 dark:text-muted-foreground uppercase mb-2">{category}</p>
                      <div className="space-y-2">
                        {categorySkills.map((skill: Skill) => (
                          <div key={skill.id}>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground dark:text-zinc-400">{skill.name}</span>
                              <span className="text-zinc-400">{skill.proficiency}%</span>
                            </div>
                            <div className="mt-1 h-1.5 w-full bg-zinc-200 dark:bg-zinc-800">
                              <div className="h-full bg-blue-700 dark:bg-blue-500" style={{ width: `${skill.proficiency}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {languages.length > 0 && visibility.languages !== false && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">{t("languages")}</h3>
                  <div className="space-y-2">
                    {languages.map((lang: Language) => (
                      <div key={lang.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground dark:text-zinc-400">{lang.language}</span>
                        <span className="text-xs text-zinc-500">{lang.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {references.length > 0 && visibility.references !== false && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">{t("references")}</h3>
                  <div className="space-y-4">
                    {references.slice(0, 2).map((ref: Reference) => (
                      <div key={ref.id} className="border-l-2 border-blue-700 dark:border-blue-500 pl-3">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">{ref.name}</p>
                        {ref.position && <p className="text-xs text-zinc-500">{ref.position}</p>}
                        {ref.organization && <p className="text-xs text-zinc-500">{ref.organization}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </aside>
        </div>

        {/* Download Section */}
        <section className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-blue-700 dark:text-blue-400" />
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{t("downloadResume")}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("printToPdf")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <DownloadButton
                  key={t.id}
                  template={t.id}
                  label={t.label}
                  variant={t.id === resume.template ? "default" : "outline"}
                  className={t.id === resume.template ? "bg-blue-700 text-white hover:bg-blue-800" : ""}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{t("downloadPdf")}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("serverGeneratedPdf")}</p>
              </div>
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
