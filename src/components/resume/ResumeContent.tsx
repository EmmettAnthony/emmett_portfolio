"use client";

import { motion } from "framer-motion";
import { Download, MapPin, Mail, Briefcase, GraduationCap, Award, CheckCircle2 } from "lucide-react";
import { Timeline } from "@/components/shared/Timeline";
import { SkillBar } from "@/components/ui/SkillBar";
import { useTranslations } from "@/lib/i18n";
import resume from "@/data/resume.json";
import skills from "@/data/skills.json";
import { useSiteSettings } from "@/components/settings/SiteSettingsProvider";

const timelineItems = resume.experience.map((exp) => ({
  id: exp.id,
  title: exp.position,
  subtitle: `${exp.company} • ${exp.location}`,
  date: `${exp.startDate} - ${exp.current ? "Present" : exp.endDate}`,
  description: exp.description,
}));

export function ResumeContent() {
  const t = useTranslations("resume");
  const settings = useSiteSettings();
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {settings.siteName}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground dark:text-zinc-400">
            {settings.tagline}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {settings.address}
            </span>
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Mail className="h-4 w-4" />
              {settings.email}
            </a>
          </div>
        </div>
        <motion.a
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.print();
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-900 px-5 text-sm font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Download className="h-4 w-4" />
          {t("downloadCV")}
        </motion.a>
      </div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
          <Briefcase className="h-5 w-5 text-blue-600" />
          {t("professionalSummary")}
        </h2>
        <p className="mt-3 leading-relaxed text-muted-foreground dark:text-zinc-400">
          {resume.summary}
        </p>
      </motion.div>

      {/* Experience */}
      <div className="mt-16">
        <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
          <Briefcase className="h-5 w-5 text-blue-600" />
          {t("workExperience")}
        </h2>
        <div className="mt-8">
          <Timeline items={timelineItems} />
        </div>
      </div>

      {/* Skills */}
      <div className="mt-16">
        <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
          <Award className="h-5 w-5 text-blue-600" />
          {t("technicalSkills")}
        </h2>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {skills.map((category) => (
            <div
              key={category.category}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {category.category}
              </h3>
              <div className="space-y-3">
                {category.skills.map((skill) => (
                  <SkillBar
                    key={skill.name}
                    name={skill.name}
                    level={skill.level}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="mt-16">
        <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
          <GraduationCap className="h-5 w-5 text-blue-600" />
          {t("education")}
        </h2>
        <div className="mt-8 space-y-6">
          {resume.education.map((edu) => (
            <div
              key={edu.id}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                {edu.degree}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                {edu.institution} • {edu.location}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {edu.startDate} - {edu.endDate}
                {edu.gpa && <> • {t("gpa")} {edu.gpa}</>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Certifications */}
      <div className="mt-16">
        <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-white">
          <Award className="h-5 w-5 text-blue-600" />
          {t("certifications")}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resume.certifications.map((cert) => (
            <a
              key={cert.id}
              href={cert.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {cert.name}
                </h4>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {cert.issuer} • {cert.date}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
