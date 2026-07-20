import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate, PDFTemplateProps, PDFExperience, PDFEducation, PDFSkill, PDFCertification, PDFAward, PDFLanguage } from "./shared";

const BG = "#0f0f23";
const TEXT = "#e0e0e0";
const MUTED = "#8888aa";
const ACCENT = "#00d4aa";
const HEADING = "#ff79c6";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: TEXT,
    backgroundColor: BG,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT,
    paddingBottom: 10,
  },
  comment: {
    fontSize: 7,
    color: "#5a5a7a",
    marginBottom: 2,
    fontStyle: "italic",
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    color: ACCENT,
    marginBottom: 2,
  },
  title: {
    fontSize: 11,
    color: HEADING,
    marginBottom: 4,
  },
  contactRow: {
    fontSize: 8,
    color: MUTED,
    flexDirection: "row" as const,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: HEADING,
    marginTop: 14,
    marginBottom: 6,
  },
  section: {
    marginBottom: 4,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 8,
    color: TEXT,
  },
  expBlock: {
    marginBottom: 10,
  },
  expHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
  },
  expTitle: {
    fontWeight: 700,
    fontSize: 10,
    color: ACCENT,
  },
  expCompany: {
    fontSize: 9,
    color: MUTED,
  },
  expDate: {
    fontSize: 8,
    color: "#5a5a7a",
  },
  bullet: {
    fontSize: 8,
    marginBottom: 1,
    paddingLeft: 10,
    color: TEXT,
  },
  techLine: {
    fontSize: 7,
    color: ACCENT,
    marginTop: 2,
    paddingLeft: 10,
  },
  eduBlock: {
    marginBottom: 5,
  },
  eduInstitution: {
    fontWeight: 700,
    fontSize: 10,
    color: ACCENT,
  },
  eduDetail: {
    fontSize: 9,
    color: TEXT,
  },
  eduDate: {
    fontSize: 8,
    color: "#5a5a7a",
  },
  skillRow: {
    fontSize: 8,
    color: TEXT,
    marginBottom: 2,
  },
  skillCategory: {
    fontSize: 8,
    color: HEADING,
    fontWeight: 700,
    marginTop: 4,
    marginBottom: 2,
  },
  certBlock: {
    marginBottom: 3,
  },
  certName: {
    fontSize: 8,
    fontWeight: 700,
    color: ACCENT,
  },
  certOrg: {
    fontSize: 8,
    color: MUTED,
  },
  langText: {
    fontSize: 8,
    color: TEXT,
  },
  awardBlock: {
    marginBottom: 3,
  },
  awardTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: ACCENT,
  },
  awardOrg: {
    fontSize: 8,
    color: MUTED,
  },
});

export const DeveloperPDF: React.FC<PDFTemplateProps> = ({ resume, experiences, education, skills, certifications, awards, languages }) => {
  const vis = resume.visibility ?? {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.comment}>{`// ${resume.professionalTitle}`}</Text>
          <Text style={styles.name}>{resume.fullName}</Text>
          <View style={styles.contactRow}>
            {resume.location && <Text>📍 {resume.location}</Text>}
            {resume.email && <Text>✉ {resume.email}</Text>}
            {resume.phone && <Text>📞 {resume.phone}</Text>}
          </View>
        </View>

        {resume.summary && vis.summary !== false && (
          <View style={styles.section}>
            <Text style={styles.comment}>{"// about.exe —v"}</Text>
            <Text style={styles.sectionTitle}>$ cat summary.txt</Text>
            <Text style={styles.text}>{resume.summary}</Text>
          </View>
        )}

        {experiences?.length > 0 && vis.experience !== false && (
          <View style={styles.section}>
            <Text style={styles.comment}>{`// career.log —n ${experiences.length}`}</Text>
            <Text style={styles.sectionTitle}>$ ls -la experience/</Text>
            {experiences.map((exp: PDFExperience) => {
              const responsibilities: string[] = exp.responsibilities ?? [];
              const technologies: string[] = exp.technologies ?? [];
              return (
                <View key={exp.id} style={styles.expBlock}>
                  <View style={styles.expHeader}>
                    <View>
                      <Text style={styles.expTitle}>{exp.jobTitle}</Text>
                      <Text style={styles.expCompany}>@{exp.company}</Text>
                    </View>
                    <Text style={styles.expDate}>
                      [{formatDate(exp.startDate)} → {exp.current ? "HEAD" : exp.endDate ? formatDate(exp.endDate) : ""}]
                    </Text>
                  </View>
                  {responsibilities.length > 0 && responsibilities.map((r: string, i: number) => (
                    <Text key={i} style={styles.bullet}>• {r}</Text>
                  ))}
                  {technologies.length > 0 && (
                    <Text style={styles.techLine}>{`// stack: ${technologies.join(", ")}`}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {education?.length > 0 && vis.education !== false && (
          <View style={styles.section}>
            <Text style={styles.comment}>{"// education history"}</Text>
            <Text style={styles.sectionTitle}>$ cat education.json</Text>
            {education.map((edu: PDFEducation) => (
              <View key={edu.id} style={styles.eduBlock}>
                <Text style={styles.eduInstitution}>{edu.institution}</Text>
                <Text style={styles.eduDetail}>
                  {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                </Text>
                <Text style={styles.eduDate}>
                  {formatDate(edu.startDate)} → {edu.endDate ? formatDate(edu.endDate) : "Present"}
                  {edu.grade ? ` | gpa: ${edu.grade}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {skills?.length > 0 && vis.skills !== false && (
          <View style={styles.section}>
            <Text style={styles.comment}>{"// skills inventory"}</Text>
            <Text style={styles.sectionTitle}>$ npm list --depth=0</Text>
            {(() => {
              const grouped: Record<string, PDFSkill[]> = {};
              skills.forEach((s: PDFSkill) => {
                const cat = s.category || "General";
                if (!grouped[cat]) grouped[cat] = [];
                grouped[cat].push(s);
              });
              return Object.entries(grouped).map(([cat, items]) => (
                <View key={cat}>
                  <Text style={styles.skillCategory}>{cat}:</Text>
                  {items.map((s: PDFSkill) => (
                    <Text key={s.id} style={styles.skillRow}>  ├─ {s.name}{s.proficiency ? ` (${s.proficiency}%)` : ""}</Text>
                  ))}
                </View>
              ));
            })()}
          </View>
        )}

        {certifications?.length > 0 && vis.certifications !== false && (
          <View style={styles.section}>
            <Text style={styles.comment}>{"// certifications"}</Text>
            <Text style={styles.sectionTitle}>$ curl certs/</Text>
            {certifications.map((c: PDFCertification) => (
              <View key={c.id} style={styles.certBlock}>
                <Text style={styles.certName}>{c.name}</Text>
                <Text style={styles.certOrg}>{c.organization} [{formatDate(c.issueDate)}]</Text>
              </View>
            ))}
          </View>
        )}

        {languages?.length > 0 && vis.languages !== false && (
          <View style={styles.section}>
            <Text style={styles.comment}>{"// i18n config"}</Text>
            <Text style={styles.sectionTitle}>$ locale -a</Text>
            <Text style={styles.langText}>
              {languages.map((l: PDFLanguage) => `${l.language} (${l.proficiency})`).join(" · ")}
            </Text>
          </View>
        )}

        {awards?.length > 0 && vis.awards !== false && (
          <View style={styles.section}>
            <Text style={styles.comment}>{"// awards & recognition"}</Text>
            <Text style={styles.sectionTitle}>$ git log --oneline awards</Text>
            {awards.map((a: PDFAward) => (
              <View key={a.id} style={styles.awardBlock}>
                <Text style={styles.awardTitle}>🏆 {a.title}</Text>
                <Text style={styles.awardOrg}>{a.organization}{a.date ? ` [${formatDate(a.date)}]` : ""}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
