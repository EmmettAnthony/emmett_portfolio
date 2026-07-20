import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate, PDFTemplateProps, PDFExperience, PDFEducation, PDFSkill, PDFCertification, PDFAward, PDFLanguage } from "./shared";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 2,
    color: "#111",
  },
  title: {
    fontSize: 11,
    color: "#666",
    marginBottom: 6,
  },
  contactRow: {
    fontSize: 8,
    color: "#888",
    flexDirection: "row" as const,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#333",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    paddingBottom: 2,
    marginTop: 14,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
  },
  section: {
    marginBottom: 4,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 6,
    color: "#444",
  },
  expBlock: {
    marginBottom: 8,
  },
  expHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between",
  },
  expTitle: {
    fontWeight: 700,
    fontSize: 10,
    color: "#222",
  },
  expCompany: {
    fontSize: 9,
    color: "#555",
  },
  expDate: {
    fontSize: 8,
    color: "#999",
  },
  bullet: {
    fontSize: 8,
    marginBottom: 1,
    paddingLeft: 8,
    color: "#555",
  },
  eduBlock: {
    marginBottom: 5,
  },
  eduInstitution: {
    fontWeight: 700,
    fontSize: 9,
    color: "#222",
  },
  eduDetail: {
    fontSize: 8,
    color: "#555",
  },
  eduDate: {
    fontSize: 8,
    color: "#999",
  },
  skillRow: {
    fontSize: 8,
    color: "#555",
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 2,
  },
  certBlock: {
    marginBottom: 3,
  },
  certName: {
    fontSize: 8,
    fontWeight: 700,
    color: "#333",
  },
  certOrg: {
    fontSize: 8,
    color: "#777",
  },
  langText: {
    fontSize: 8,
    color: "#555",
  },
  awardBlock: {
    marginBottom: 3,
  },
  awardTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#333",
  },
  awardOrg: {
    fontSize: 8,
    color: "#777",
  },
});

export const MinimalistPDF: React.FC<PDFTemplateProps> = ({ resume, experiences, education, skills, certifications, awards, languages }) => {
  const vis = resume.visibility ?? {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{resume.fullName}</Text>
          <Text style={styles.title}>{resume.professionalTitle}</Text>
          <View style={styles.contactRow}>
            {resume.location && <Text>{resume.location}</Text>}
            {resume.email && <Text>{resume.email}</Text>}
            {resume.phone && <Text>{resume.phone}</Text>}
          </View>
        </View>

        {resume.summary && vis.summary !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.text}>{resume.summary}</Text>
          </View>
        )}

        {experiences?.length > 0 && vis.experience !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experiences.map((exp: PDFExperience) => {
              const responsibilities: string[] = exp.responsibilities ?? [];
              const technologies: string[] = exp.technologies ?? [];
              return (
                <View key={exp.id} style={styles.expBlock}>
                  <View style={styles.expHeader}>
                    <View>
                      <Text style={styles.expTitle}>{exp.jobTitle}</Text>
                      <Text style={styles.expCompany}>{exp.company}</Text>
                    </View>
                    <Text style={styles.expDate}>
                      {formatDate(exp.startDate)} – {exp.current ? "Present" : exp.endDate ? formatDate(exp.endDate) : ""}
                    </Text>
                  </View>
                  {responsibilities.length > 0 && responsibilities.map((r: string, i: number) => (
                    <Text key={i} style={styles.bullet}>• {r}</Text>
                  ))}
                  {technologies.length > 0 && (
                    <Text style={{ fontSize: 7, color: "#999", marginTop: 1, paddingLeft: 8 }}>
                      {technologies.join(", ")}
                    </Text>
                  )}
                  <View style={styles.divider} />
                </View>
              );
            })}
          </View>
        )}

        {education?.length > 0 && vis.education !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((edu: PDFEducation) => (
              <View key={edu.id} style={styles.eduBlock}>
                <Text style={styles.eduInstitution}>{edu.institution}</Text>
                <Text style={styles.eduDetail}>
                  {edu.degree}{edu.fieldOfStudy ? ` in ${edu.fieldOfStudy}` : ""}
                </Text>
                <Text style={styles.eduDate}>
                  {formatDate(edu.startDate)} – {edu.endDate ? formatDate(edu.endDate) : "Present"}
                  {edu.grade ? ` | GPA: ${edu.grade}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}

        {skills?.length > 0 && vis.skills !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {skills.map((s: PDFSkill) => (
              <Text key={s.id} style={styles.skillRow}>— {s.name}{s.category ? ` (${s.category})` : ""}</Text>
            ))}
          </View>
        )}

        {certifications?.length > 0 && vis.certifications !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((c: PDFCertification) => (
              <View key={c.id} style={styles.certBlock}>
                <Text style={styles.certName}>{c.name}</Text>
                <Text style={styles.certOrg}>{c.organization} • {formatDate(c.issueDate)}</Text>
              </View>
            ))}
          </View>
        )}

        {languages?.length > 0 && vis.languages !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.langText}>
              {languages.map((l: PDFLanguage) => `${l.language} (${l.proficiency})`).join(" · ")}
            </Text>
          </View>
        )}

        {awards?.length > 0 && vis.awards !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awards</Text>
            {awards.map((a: PDFAward) => (
              <View key={a.id} style={styles.awardBlock}>
                <Text style={styles.awardTitle}>{a.title}</Text>
                <Text style={styles.awardOrg}>
                  {a.organization}{a.date ? ` • ${formatDate(a.date)}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
