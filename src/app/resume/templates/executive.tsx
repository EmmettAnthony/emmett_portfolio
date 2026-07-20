"use client";

import { useTranslations } from "@/lib/i18n";
import { DownloadButton } from "../DownloadButton";
import { ShareButton } from "@/components/resume/ShareButton";
import { MapPin, Mail, Phone, Globe, Calendar, Award, CheckCircle2, ExternalLink, Star, Quote, Download, Printer } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { type TemplateProps, type Experience, type Skill, type Education, type Certification, type ResumeAward, type Language, type Reference, type FeaturedProject, formatDate } from "./types";
import { ResumeSectionTracker } from "@/components/resume/ResumeSectionTracker";

export function ExecutiveTemplate({
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
  const t = useTranslations("resume.templates");
  const templates = [
    { id: "executive", label: "Executive" },
    { id: "modern", label: "Modern" },
    { id: "corporate", label: "Corporate" },
    { id: "minimalist", label: "Minimalist" },
    { id: "developer", label: "Developer" },
  ];

  const topSkills = skills
    .sort((a: { proficiency: number }, b: { proficiency: number }) => b.proficiency - a.proficiency)
    .slice(0, 6);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-950">
      {/* Hero with pattern overlay */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, rgba(255,255,255,0.2) 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="pointer-events-none absolute -right-40 -top-40 h-[250px] w-[250px] rounded-full bg-amber-500/10 blur-3xl sm:h-[500px] sm:w-[500px]" />
        <div className="pointer-events-none absolute -left-40 -bottom-40 h-[200px] w-[200px] rounded-full bg-amber-500/5 blur-3xl sm:h-[400px] sm:w-[400px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            {resume.photo && (
              <div className="h-32 w-32 md:h-40 md:w-40 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-amber-500/30 shadow-2xl shadow-amber-900/20">
                <Image
                  src={resume.photo}
                  alt={resume.fullName ?? ""}
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {resume.fullName}
              </h1>
              <p className="mt-2 text-xl font-light text-amber-400/90">
                {resume.professionalTitle}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-zinc-400">
                {resume.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-500" />
                    {resume.location}
                  </span>
                )}
                {resume.email && (
                  <a href={`mailto:${resume.email}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-amber-400">
                    <Mail className="h-4 w-4 text-amber-500" />
                    {resume.email}
                  </a>
                )}
                {resume.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-amber-500" />
                    {resume.phone}
                  </span>
                )}
                {resume.website && (
                  <a href={resume.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-amber-400">
                    <Globe className="h-4 w-4 text-amber-500" />
                    {resume.website.replace(/https?:\/\//, "")}
                  </a>
                )}
                {resume.yearsOfExperience != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    {t("yearsOfExperience", { years: resume.yearsOfExperience })}
                  </span>
                )}
              </div>
              {resume.socialLinks.length > 0 && (
                <div className="mt-4 flex items-center justify-center md:justify-start gap-3">
                  {resume.socialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-zinc-400 hover:text-amber-400 transition-colors"
                    >
                      {link.label || link.url.replace(/https?:\/\//, "")}
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <ShareButton className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 hover:text-amber-200" />
                <DownloadButton
                  template={resume.template}
                  label={t("downloadResume")}
                  variant="default"
                  className="bg-amber-600 text-white hover:bg-amber-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics bar */}
      {resume.yearsOfExperience != null || topSkills.length > 0 ? (
        <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap items-center justify-center gap-8">
              {resume.yearsOfExperience != null && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{resume.yearsOfExperience}+</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("yearsExperience")}</p>
                </div>
              )}
              {experiences.length > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{experiences.length}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("positionsHeld")}</p>
                </div>
              )}
              {certifications.length > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{certifications.length}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("certifications")}</p>
              </div>
            )}
            {featuredProjects.length > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{featuredProjects.length}</p>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{t("keyProjects")}</p>
                </div>
              )}
              {topSkills.slice(0, 4).map((skill: Skill) => (
                <div key={skill.id} className="text-center">
                  <p className="text-lg font-bold text-zinc-800 dark:text-zinc-200">{skill.proficiency}%</p>
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{skill.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Summary */}
        {resume.summary && visibility.summary !== false && (
          <ResumeSectionTracker section="summary">
          <section className="mb-16">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-1 w-10 bg-amber-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  {resume.summaryTitle || t("executiveSummary")}
                </h2>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground dark:text-zinc-400">
                {resume.summary}
              </p>
              {resume.specializations?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {resume.specializations.map((spec, i) => (
                    <Badge key={i} variant="secondary" className="rounded-full px-3 py-1 text-xs font-medium">
                      {spec}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Experience */}
        {experiences.length > 0 && visibility.experience !== false && (
          <ResumeSectionTracker section="experience">
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-10 bg-amber-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("experience")}</h2>
            </div>
            <div className="space-y-8">
              {experiences.map((exp: Experience) => {
                const responsibilities = (exp.responsibilities as string[]) ?? [];
                const achievements = (exp.achievements as string[]) ?? [];
                const technologies = (exp.technologies as string[]) ?? [];
                return (
                  <Card key={exp.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {exp.jobTitle}
                          </CardTitle>
                          <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                            {exp.company}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {exp.employmentType || t("fullTime")}
                          </Badge>
                          <span className="whitespace-nowrap text-xs text-zinc-500">
                            {formatDate(exp.startDate)} &mdash; {exp.current ? t("present") : exp.endDate ? formatDate(exp.endDate) : ""}
                          </span>
                        </div>
                      </div>
                      {exp.location && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {exp.location}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {responsibilities.length > 0 && (
                        <ul className="space-y-2">
                          {responsibilities.map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground dark:text-zinc-400">
                              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-500" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}
                      {achievements.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">{t("keyAchievements")}</p>
                          <ul className="space-y-1.5">
                            {achievements.map((a: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground dark:text-zinc-400">
                                <Star className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {technologies.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {technologies.map((t: string, i: number) => (
                            <Badge key={i} variant="secondary" className="rounded-md px-2 py-0.5 text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Education & Certifications in grid */}
        <div className="grid gap-8 lg:grid-cols-2 mb-16">
          {education.length > 0 && visibility.education !== false && (
            <ResumeSectionTracker section="education">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 bg-amber-500" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("education")}</h2>
              </div>
              <div className="space-y-4">
                {education.map((edu: Education) => (
                  <Card key={edu.id} size="sm" className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold">{edu.institution}</CardTitle>
                      <CardDescription>
                        {edu.degree}{edu.fieldOfStudy ? ` ${t("in")} ${edu.fieldOfStudy}` : ""}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-zinc-500">
                        {formatDate(edu.startDate)} &mdash; {edu.endDate ? formatDate(edu.endDate) : t("present")}
                        {edu.grade ? ` | ${edu.grade}` : ""}
                      </p>
                      {edu.description && <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-2">{edu.description}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            </ResumeSectionTracker>
          )}

          {certifications.length > 0 && visibility.certifications !== false && (
            <ResumeSectionTracker section="certifications">
            <section>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1 w-8 bg-amber-500" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("certifications")}</h2>
              </div>
              <div className="space-y-4">
                {certifications.map((cert: Certification) => (
                  <Card key={cert.id} size="sm" className="shadow-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-semibold">{cert.name}</CardTitle>
                          <CardDescription>{cert.organization}</CardDescription>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>{t("issued")}{formatDate(cert.issueDate)}</span>
                        {cert.expiryDate && <span>{t("expires")}{formatDate(cert.expiryDate)}</span>}
                      </div>
                      {cert.credentialId && <p className="text-xs text-zinc-400 mt-1">{t("credentialId")}{cert.credentialId}</p>}
                      {cert.credentialUrl && (
                        <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline">
                          <ExternalLink className="h-3 w-3" />
                          {t("viewCredential")}
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            </ResumeSectionTracker>
          )}
        </div>

        {/* Skills */}
        {skills.length > 0 && visibility.skills !== false && (
          <ResumeSectionTracker section="skills">
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-10 bg-amber-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("coreCompetencies")}</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                  <Card key={category} className="shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {categorySkills.map((skill: Skill) => (
                          <div key={skill.id}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-zinc-900 dark:text-white">{skill.name}</span>
                              <span className="text-xs text-zinc-500">{skill.proficiency}%</span>
                            </div>
                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600" style={{ width: `${skill.proficiency}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Awards */}
        {awards.length > 0 && visibility.awards !== false && (
          <ResumeSectionTracker section="awards">
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-10 bg-amber-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("awards")}</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {awards.map((award: ResumeAward) => (
                <div key={award.id} className="flex items-start gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">{award.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {[award.organization, award.date ? formatDate(award.date) : null].filter(Boolean).join(" • ")}
                    </p>
                    {award.description && <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-2">{award.description}</p>}
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
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-10 bg-amber-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("languages")}</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {languages.map((lang: Language) => (
                <div key={lang.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 shadow-sm">
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">{lang.language}</span>
                  <span className="text-xs text-zinc-500">({lang.proficiency})</span>
                </div>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* References as quote cards */}
        {references.length > 0 && visibility.references !== false && (
          <ResumeSectionTracker section="references">
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-10 bg-amber-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("testimonials")}</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {references.map((ref: Reference) => (
                <Card key={ref.id} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <Quote className="h-6 w-6 text-amber-400/50 mb-2" />
                    <CardTitle className="text-base font-semibold">{ref.name}</CardTitle>
                    {(ref.position || ref.organization) && (
                      <CardDescription>
                        {ref.position}{ref.position && ref.organization ? " at " : ""}{ref.organization}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {(ref.email || ref.phone) && (
                    <CardContent>
                      <div className="space-y-1 text-xs text-zinc-500">
                        {ref.email && (
                          <a href={`mailto:${ref.email}`} className="flex items-center gap-1.5 transition-colors hover:text-amber-600 dark:hover:text-amber-400">
                            <Mail className="h-3.5 w-3.5" />
                            {ref.email}
                          </a>
                        )}
                        {ref.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {ref.phone}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Featured Projects */}
        {featuredProjects.length > 0 && visibility.featuredProjects !== false && (
          <ResumeSectionTracker section="featuredProjects">
          <section className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-10 bg-amber-500" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{t("keyProjects")}</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.slice(0, 3).map((fp: FeaturedProject) => {
                const project = fp.project;
                return (
                  <Card key={fp.id} className="shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          {project.category?.name || t("project")}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      </div>
                      <CardTitle className="mt-2 text-base font-semibold">{project.title}</CardTitle>
                      {project.shortDescription && (
                        <CardDescription className="line-clamp-2">{project.shortDescription}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      {project.technologies?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {project.technologies.slice(0, 4).map((tech: { id: string; name: string }) => (
                            <Badge key={tech.id} variant="secondary" className="rounded-md px-2 py-0.5 text-xs">
                              {tech.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* Download Section */}
        <section className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Printer className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white">{t("printToPdf")}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("chooseTemplate")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <DownloadButton
                  key={t.id}
                  template={t.id}
                  label={t.label}
                  variant={t.id === resume.template ? "default" : "outline"}
                  className={t.id === resume.template ? "bg-amber-600 text-white hover:bg-amber-500" : ""}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
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
