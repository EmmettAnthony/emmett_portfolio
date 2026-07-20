import { getTranslations } from "next-intl/server";
import { AnimateOnScroll } from "@/components/shared/AnimateOnScroll";
import { SectionHeader } from "@/components/shared/SectionHeader";
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
  AlertTriangle,
  Star,
  Quote,
  FileText,
  Download,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { GithubIcon, LinkedInIcon, TwitterIcon } from "@/components/ui/SocialIcons";
import { type TemplateProps, type Experience, type Skill, type Education, type Certification, type ResumeAward, type Language, type Reference, type FeaturedProject, type Testimonial, formatDate, getProficiencyStars } from "./types";
import { ResumeSectionTracker } from "@/components/resume/ResumeSectionTracker";

function getSocialIcon(url: string) {
  if (url.includes("github")) return <GithubIcon className="h-5 w-5" />;
  if (url.includes("linkedin")) return <LinkedInIcon className="h-5 w-5" />;
  if (url.includes("twitter") || url.includes("x.com")) return <TwitterIcon className="h-5 w-5" />;
  return <ExternalLink className="h-5 w-5" />;
}

export async function ModernTemplate({
  resume,
  experiences,
  education,
  skills,
  certifications,
  awards,
  languages,
  references,
  featuredProjects,
  testimonials,
  visibility,
}: TemplateProps) {
  const t = await getTranslations("resume.templates");
  const specializations = resume.specializations ?? [];
  const templates = [
    { id: "modern", label: "Modern" },
    { id: "corporate", label: "Corporate" },
    { id: "minimalist", label: "Minimalist" },
    { id: "developer", label: "Developer" },
    { id: "executive", label: "Executive" },
  ];

  return (
    <>
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 pb-20 pt-28 md:pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="pointer-events-none absolute -right-60 -top-60 h-[250px] w-[250px] rounded-full bg-blue-500/20 blur-3xl sm:h-[500px] sm:w-[500px]" />
        <div className="pointer-events-none absolute -left-60 bottom-0 h-[200px] w-[200px] rounded-full bg-purple-500/20 blur-3xl sm:h-[400px] sm:w-[400px]" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll distance={30}>
            <div className="flex flex-col items-center text-center">
              {resume.photo && (
                <div className="mb-6 h-32 w-32 overflow-hidden rounded-full border-4 border-white/20 shadow-xl shadow-blue-900/30">
                  <Image
                    src={resume.photo}
                    alt={resume.fullName ?? ""}
                    width={128}
                    height={128}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              )}

              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                {resume.fullName}
              </h1>

              <p className="mt-3 max-w-2xl text-lg text-blue-200 sm:text-xl">
                {resume.professionalTitle}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-blue-200/80">
                {resume.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-blue-300" />
                    {resume.location}
                  </span>
                )}
                {resume.yearsOfExperience != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-blue-300" />
                    {t("yearsOfExperience", { years: resume.yearsOfExperience })}
                  </span>
                )}
                {resume.email && (
                  <a
                    href={`mailto:${resume.email}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                  >
                    <Mail className="h-4 w-4 text-blue-300" />
                    {resume.email}
                  </a>
                )}
                {resume.phone && (
                  <a
                    href={`tel:${resume.phone}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                  >
                    <Phone className="h-4 w-4 text-blue-300" />
                    {resume.phone}
                  </a>
                )}
                {resume.website && (
                  <a
                    href={resume.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-white"
                  >
                    <Globe className="h-4 w-4 text-blue-300" />
                    {t("website")}
                  </a>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3">
                {resume.socialLinks.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white"
                    aria-label={link.label || t("socialLink")}
                  >
                    {getSocialIcon(link.url)}
                  </a>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <ShareButton className="border-white/20 text-white hover:bg-white/10" />
                <DownloadButton
                  template={resume.template}
                  label={t("downloadResume")}
                  variant="default"
                  className="bg-white text-slate-900 hover:bg-blue-50 hover:text-slate-900"
                />
                {resume.email && (
                  <a
                    href={`mailto:${resume.email}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/20 bg-transparent px-2.5 text-sm font-medium text-white transition-all hover:bg-white/10"
                  >
                    <Mail className="h-4 w-4" />
                    {t("contactMe")}
                  </a>
                )}
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Professional Summary ── */}
        {resume.summary && visibility.summary !== false && (
          <ResumeSectionTracker section="summary">
          <section className="py-20">
            <AnimateOnScroll>
              <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 md:p-12">
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/5 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {resume.summaryTitle || t("executiveSummary")}
                    </h2>
                  </div>
                  <p className="mt-6 text-base leading-relaxed text-muted-foreground dark:text-zinc-400 md:text-lg">
                    {resume.summary}
                  </p>
                  {specializations.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {specializations.map((spec, i) => (
                        <Badge
                          key={i}
                          variant="secondary"
                          className="rounded-full px-3 py-1 text-xs font-medium"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </AnimateOnScroll>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Work Experience ── */}
        {experiences.length > 0 && visibility.experience !== false && (
          <ResumeSectionTracker section="experience">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("workExperience")}
                subtitle={t("workExperienceDesc")}
              />
            </AnimateOnScroll>

            <div className="relative mt-12">
              <div className="absolute left-[23px] top-0 h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" />

              <div className="space-y-12">
                {experiences.map((exp: Experience, index: number) => {
                  const responsibilities = (exp.responsibilities as string[]) ?? [];
                  const achievements = (exp.achievements as string[]) ?? [];
                  const technologies = (exp.technologies as string[]) ?? [];

                  return (
                    <AnimateOnScroll
                      key={exp.id}
                      delay={index * 0.1}
                      direction="left"
                      distance={20}
                      className="relative pl-14"
                    >
                      <div className="absolute left-[15px] top-1.5 h-4 w-4 rounded-full border-2 border-blue-600 bg-white dark:bg-zinc-950" />

                      <div className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                              {exp.jobTitle}
                            </h3>
                            <p className="mt-0.5 text-sm font-medium text-blue-600 dark:text-blue-400">
                              {exp.company}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {exp.employmentType || t("fullTime")}
                            </Badge>
                            <span className="whitespace-nowrap text-xs text-zinc-500">
                              {formatDate(exp.startDate)} &mdash;{" "}
                              {exp.current ? t("present") : exp.endDate ? formatDate(exp.endDate) : ""}
                            </span>
                          </div>
                        </div>

                        {exp.location && (
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                            <MapPin className="mr-1 inline h-3.5 w-3.5" />
                            {exp.location}
                          </p>
                        )}

                        {responsibilities.length > 0 && (
                          <ul className="mt-4 space-y-2">
                            {responsibilities.map((item: string, i: number) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-muted-foreground dark:text-zinc-400"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}

                        {achievements.length > 0 && (
                          <>
                            <h4 className="mt-4 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                              {t("keyAchievements")}
                            </h4>
                            <ul className="mt-2 space-y-2">
                              {achievements.map((item: string, i: number) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-2 text-sm text-muted-foreground dark:text-zinc-400"
                                >
                                  <Award className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}

                        {technologies.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {technologies.map((tech: string, i: number) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="rounded-md px-2 py-0.5 text-xs font-medium"
                              >
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </AnimateOnScroll>
                  );
                })}
              </div>
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Education ── */}
        {education.length > 0 && visibility.education !== false && (
          <ResumeSectionTracker section="education">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("education")}
                subtitle={t("educationDesc")}
              />
            </AnimateOnScroll>

            <div className="relative mt-12">
              <div className="absolute left-[23px] top-0 h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" />

              <div className="space-y-12">
                {education.map((edu: Education, index: number) => (
                  <AnimateOnScroll
                    key={edu.id}
                    delay={index * 0.1}
                    direction="left"
                    distance={20}
                    className="relative pl-14"
                  >
                    <div className="absolute left-[15px] top-1.5 h-4 w-4 rounded-full border-2 border-purple-600 bg-white dark:bg-zinc-950" />

                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                              {edu.degree || t("education")}
                            </h3>
                          <p className="mt-0.5 text-sm font-medium text-purple-600 dark:text-purple-400">
                            {edu.institution}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-zinc-500">
                          {formatDate(edu.startDate)} &mdash;{" "}
                          {edu.endDate ? formatDate(edu.endDate) : t("present")}
                        </span>
                      </div>

                      {edu.fieldOfStudy && (
                        <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                          {t("fieldOfStudy")}{edu.fieldOfStudy}
                        </p>
                      )}

                      {edu.grade && (
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                          {t("grade")}{edu.grade}
                        </p>
                      )}

                      {edu.description && (
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Technical Skills ── */}
        {skills.length > 0 && visibility.skills !== false && (
          <ResumeSectionTracker section="skills">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("technicalSkills")}
                subtitle={t("technicalSkillsDesc")}
              />
            </AnimateOnScroll>

            <div className="mt-12 grid gap-6 md:grid-cols-2">
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
                return Object.entries(grouped).map(([category, categorySkills]: [string, Skill[]], catIndex: number) => (
                  <AnimateOnScroll
                    key={category}
                    delay={catIndex * 0.1}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                      {category}
                    </h3>
                    <div className="space-y-4">
                      {categorySkills.map((skill: Skill) => (
                        <div key={skill.id}>
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-900 dark:text-white">
                              {skill.name}
                            </span>
                            <span className="text-zinc-500">
                              {skill.proficiency}%
                              {skill.yearsOfExperience != null && (
                                <span className="ml-2 text-xs text-zinc-400">
                                  &middot; {skill.yearsOfExperience}y
                                </span>
                              )}
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                              style={{ width: `${skill.proficiency}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AnimateOnScroll>
                ));
              })()}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Certifications ── */}
        {certifications.length > 0 && visibility.certifications !== false && (
          <ResumeSectionTracker section="certifications">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("certifications")}
                subtitle={t("certificationsDesc")}
              />
            </AnimateOnScroll>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert: Certification, index: number) => {
                const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();

                return (
                  <AnimateOnScroll key={cert.id} delay={index * 0.1}>
                    <Card className="group h-full transition-all hover:shadow-md">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          {isExpired && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <AlertTriangle className="h-3 w-3" />
                              {t("expired")}
                            </span>
                          )}
                        </div>
                        <CardTitle className="mt-3 text-base font-semibold">
                          {cert.name}
                        </CardTitle>
                        <CardDescription>
                          {cert.organization}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>{t("issued")}{formatDate(cert.issueDate)}</span>
                          {cert.expiryDate && <span>{t("expires")}{formatDate(cert.expiryDate)}</span>}
                        </div>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            {t("viewCredential")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Featured Projects ── */}
        {featuredProjects.length > 0 && visibility.featuredProjects !== false && (
          <ResumeSectionTracker section="featuredProjects">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("featuredProjects")}
                subtitle={t("featuredProjectsDesc")}
              />
            </AnimateOnScroll>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.slice(0, 3).map((fp: FeaturedProject, index: number) => {
                const project = fp.project;
                return (
                  <AnimateOnScroll key={fp.id} delay={index * 0.1}>
                    <Link href={`/portfolio/${project.slug}`}>
                      <Card className="group h-full cursor-pointer transition-all hover:shadow-xl">
                        {project.featuredImage && (
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <Image
                              src={project.featuredImage}
                              alt={project.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized
                            />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                              {project.category?.name || t("project")}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-blue-500" />
                          </div>
                          <CardTitle className="mt-1 text-base font-semibold">
                            {project.title}
                          </CardTitle>
                          {project.shortDescription && (
                            <CardDescription className="line-clamp-2">
                              {project.shortDescription}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1.5">
                            {project.technologies?.slice(0, 4).map((tech: { id: string; name: string }) => (
                              <Badge key={tech.id} variant="secondary" className="rounded-md px-2 py-0.5 text-xs">
                                {tech.name}
                              </Badge>
                            ))}
                            {project.technologies?.length > 4 && (
                              <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-xs">
                                +{project.technologies.length - 4}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-3 flex gap-3">
                            {project.liveUrl && (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                                <ExternalLink className="h-3 w-3" />
                                {t("live")}
                              </span>
                            )}
                            {project.githubUrl && (
                              <span className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                                <GithubIcon className="h-3 w-3" />
                                {t("github")}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </AnimateOnScroll>
                );
              })}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Awards & Achievements ── */}
        {awards.length > 0 && visibility.awards !== false && (
          <ResumeSectionTracker section="awards">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("awards")}
                subtitle={t("awardsDesc")}
              />
            </AnimateOnScroll>

            <div className="mt-12 space-y-4">
              {awards.map((award: ResumeAward, index: number) => (
                <AnimateOnScroll key={award.id} delay={index * 0.1}>
                  <div className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-zinc-900 dark:text-white">
                        {award.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-muted-foreground dark:text-zinc-400">
                        {[award.organization, award.date ? formatDate(award.date) : null]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                      {award.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                          {award.description}
                        </p>
                      )}
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Testimonials ── */}
        {testimonials && testimonials.length > 0 && (
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("testimonials")}
                subtitle={t("testimonialsDesc")}
              />
            </AnimateOnScroll>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t: Testimonial, index: number) => (
                <AnimateOnScroll key={t.id} delay={index * 0.1}>
                  <blockquote className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <p className="flex-1 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                      &ldquo;{t.content}&rdquo;
                    </p>
                    <footer className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <strong className="block text-sm font-semibold text-zinc-900 dark:text-white">
                        {t.name}
                      </strong>
                      {t.position && (
                        <span className="text-xs text-zinc-500">
                          {t.position}
                          {t.company && <span> at {t.company}</span>}
                        </span>
                      )}
                    </footer>
                  </blockquote>
                </AnimateOnScroll>
              ))}
            </div>
          </section>
        )}

        {/* ── Languages ── */}
        {languages.length > 0 && visibility.languages !== false && (
          <ResumeSectionTracker section="languages">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("languages")}
                subtitle={t("languagesDesc")}
              />
            </AnimateOnScroll>

            <div className="mt-12">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("language")}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("proficiency")}</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">{t("level")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {languages.map((lang: Language) => (
                      <tr key={lang.id} className="bg-white transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800/50">
                        <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-white">{lang.language}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < getProficiencyStars(lang.proficiency)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-zinc-200 dark:text-zinc-700"
                                }`}
                              />
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground dark:text-zinc-400">{lang.proficiency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── References ── */}
        {references.length > 0 && visibility.references !== false && (
          <ResumeSectionTracker section="references">
          <section className="pb-20">
            <AnimateOnScroll>
              <SectionHeader
                title={t("references")}
                subtitle={t("referencesDesc")}
              />
            </AnimateOnScroll>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {references.map((ref: Reference, index: number) => (
                <AnimateOnScroll key={ref.id} delay={index * 0.1}>
                  <Card className="h-full transition-all hover:shadow-md">
                    <CardHeader>
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                        <Quote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-base font-semibold">{ref.name}</CardTitle>
                      {(ref.position || ref.organization) && (
                        <CardDescription>
                          {[ref.position, ref.organization].filter(Boolean).join(" at ")}
                        </CardDescription>
                      )}
                    </CardHeader>
                    {(ref.email || ref.phone) && (
                      <CardContent>
                        <div className="space-y-1 text-xs text-zinc-500">
                          {ref.email && (
                            <a href={`mailto:${ref.email}`} className="flex items-center gap-1.5 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
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
                </AnimateOnScroll>
              ))}
            </div>
          </section>
          </ResumeSectionTracker>
        )}

        {/* ── Download Section ── */}
        <section className="pb-20">
          <AnimateOnScroll>
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 md:p-12">
              <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/5 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                    <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {t("downloadResume")}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      {t("chooseTemplateStyle")}
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {templates.map((t) => (
                    <DownloadButton
                      key={t.id}
                      template={t.id}
                      label={t.label}
                      variant={t.id === resume.template ? "default" : "outline"}
                    />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  {templates.map((t) => (
                    <DownloadButton
                      key={`pdf-${t.id}`}
                      template={t.id}
                      label={`${t.label} PDF`}
                      variant="outline"
                      mode="pdf"
                    />
                  ))}
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </section>
      </div>
    </>
  );
}
