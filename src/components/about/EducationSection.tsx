"use client";

import { motion } from "framer-motion";
import { GraduationCap, Award, ExternalLink } from "lucide-react";
import { SectionHeader } from "@/components/shared/SectionHeader";
import resume from "@/data/resume.json";

export function EducationSection() {
  return (
    <div className="mt-24">
      <SectionHeader
        title="Education & Certifications"
        subtitle="My academic background and professional certifications."
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
            Education
          </h3>
          <div className="mt-6 space-y-6">
            {resume.education.map((edu) => (
              <div
                key={edu.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h4 className="font-semibold text-zinc-900 dark:text-white">
                  {edu.degree}
                </h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  {edu.institution} • {edu.location}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                  <span>{edu.startDate} - {edu.endDate}</span>
                  {edu.gpa && (
                    <>
                      <span>•</span>
                      <span>GPA: {edu.gpa}</span>
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
            Certifications
          </h3>
          <div className="mt-6 space-y-6">
            {resume.certifications.map((cert) => (
              <a
                key={cert.id}
                href={cert.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-blue-500/30 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/20"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      {cert.name}
                    </h4>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {cert.issuer} • {cert.date}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-zinc-400 transition-colors group-hover:text-blue-600" />
                </div>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
