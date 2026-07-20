"use client";

import { motion } from "framer-motion";
import { GraduationCap, Award, ExternalLink } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { SectionHeader } from "@/components/shared/SectionHeader";

interface EducationItem {
  id: string;
  institution: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startDate: Date;
  endDate: Date | null;
  grade: string | null;
}

interface CertificationItem {
  id: string;
  name: string;
  organization: string;
  issueDate: Date;
  credentialUrl: string | null;
}

interface EducationSectionProps {
  education?: EducationItem[];
  certifications?: CertificationItem[];
}

export function EducationSection({ education = [], certifications = [] }: EducationSectionProps) {
  const t = useTranslations();
  return (
    <div className="mt-24">
      <SectionHeader
        title={t("about.education.title")}
        subtitle={t("about.education.subtitle")}
      />

      <div className="mx-auto mt-16 grid max-w-4xl gap-12 md:grid-cols-2">
        {/* Education */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            {t("about.education.education")}
          </h3>
          <div className="mt-6 space-y-6">
            {education.map((edu) => (
              <div
                key={edu.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h4 className="font-semibold text-zinc-900 dark:text-white">
                  {edu.degree ?? edu.fieldOfStudy}
                </h4>
                <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                  {edu.institution}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground dark:text-zinc-400">
                  <span>{formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : t("about.education.present")}</span>
                  {edu.grade && (
                    <>
                      <span>•</span>
                      <span>{t("about.education.grade")} {edu.grade}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h3 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-white">
            <Award className="h-5 w-5 text-blue-600" />
            {t("about.education.certifications")}
          </h3>
          <div className="mt-6 space-y-6">
            {certifications.map((cert) => {
              const url = cert.credentialUrl ?? "#";
              const Wrapper = url !== "#" ? "a" : "div";
              const wrapperProps = url !== "#" ? { href: url, target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Wrapper
                  key={cert.id}
                  {...wrapperProps}
                  className={`group block rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20 ${url !== "#" ? "cursor-pointer" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-900 dark:text-white">{cert.name}</h4>
                      <p className="mt-1 text-sm text-muted-foreground dark:text-zinc-400">
                        {cert.organization} • {formatDate(cert.issueDate)}
                      </p>
                    </div>
                    {url !== "#" && (
                      <ExternalLink className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-blue-600" />
                    )}
                  </div>
                </Wrapper>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  const date = new Date(d);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
