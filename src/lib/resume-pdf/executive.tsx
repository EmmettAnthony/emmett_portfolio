import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate, PDFTemplateProps, PDFExperience, PDFEducation, PDFSkill, PDFCertification, PDFAward, PDFLanguage } from "./shared";

const GOLD = "#b8860b";
const DARK = "#1a1a2e";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#222",
  },
  headerBar: {
    backgroundColor: DARK,
    padding: 30,
    paddingBottom: 20,
  },
  headerName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 12,
    color: GOLD,
    marginBottom: 12,
  },
  headerContact: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 16,
  },
  headerContactItem: {
    fontSize: 8,
    color: "#aaa",
  },
  body: {
    padding: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: DARK,
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 2,
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 2,
  },
  section: {
    marginBottom: 4,
  },
  text: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 8,
    color: "#333",
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
    color: DARK,
  },
  expCompany: {
    fontSize: 9,
    color: "#666",
    fontStyle: "italic",
  },
  expDate: {
    fontSize: 8,
    color: GOLD,
  },
  bullet: {
    fontSize: 8,
    marginBottom: 1,
    paddingLeft: 8,
    color: "#444",
  },
  eduBlock: {
    marginBottom: 6,
  },
  eduInstitution: {
    fontWeight: 700,
    fontSize: 10,
    color: DARK,
  },
  eduDetail: {
    fontSize: 9,
    color: "#555",
  },
  eduDate: {
    fontSize: 8,
    color: GOLD,
  },
  skillsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 4,
  },
  skillItem: {
    fontSize: 8,
    color: "#333",
    marginRight: 4,
  },
  skillDot: {
    fontSize: 8,
    color: GOLD,
  },
  certBlock: {
    marginBottom: 4,
    flexDirection: "row" as const,
    justifyContent: "space-between",
  },
  certName: {
    fontWeight: 700,
    fontSize: 9,
    color: DARK,
  },
  certOrg: {
    fontSize: 8,
    color: "#666",
  },
  langText: {
    fontSize: 8,
    color: "#444",
  },
  awardBlock: {
    marginBottom: 3,
  },
  awardTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: DARK,
  },
  awardOrg: {
    fontSize: 8,
    color: "#666",
  },
  separator: {
    height: 1,
    backgroundColor: GOLD,
    marginVertical: 2,
    opacity: 0.3,
  },
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center" as const,
    fontSize: 7,
    color: "#aaa",
    borderTopWidth: 0.5,
    borderTopColor: GOLD,
    paddingTop: 6,
  },
});

export const ExecutivePDF: React.FC<PDFTemplateProps> = ({ resume, experiences, education, skills, certifications, awards, languages }) => {
  const vis = resume.visibility ?? {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBar}>
          <Text style={styles.headerName}>{resume.fullName}</Text>
          <Text style={styles.headerTitle}>{resume.professionalTitle}</Text>
          <View style={styles.headerContact}>
            {resume.location && <Text style={styles.headerContactItem}>{resume.location}</Text>}
            {resume.email && <Text style={styles.headerContactItem}>{resume.email}</Text>}
            {resume.phone && <Text style={styles.headerContactItem}>{resume.phone}</Text>}
            {resume.website && <Text style={styles.headerContactItem}>{resume.website}</Text>}
          </View>
        </View>

        <View style={styles.body}>
          {resume.summary && vis.summary !== false && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Executive Summary</Text>
              <Text style={styles.text}>{resume.summary}</Text>
            </View>
          )}

          {experiences?.length > 0 && vis.experience !== false && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional Experience</Text>
              {experiences.map((exp: PDFExperience) => {
                const responsibilities: string[] = exp.responsibilities ?? [];
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
                      <Text key={i} style={styles.bullet}>— {r}</Text>
                    ))}
                    <View style={styles.separator} />
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
              <Text style={styles.sectionTitle}>Core Competencies</Text>
              <Text style={styles.skillsRow}>
                {skills.map((s: PDFSkill, i: number) => (
                  <Text key={s.id} style={styles.skillItem}>
                    {i > 0 && <Text style={styles.skillDot}> • </Text>}
                    {s.name}
                  </Text>
                ))}
              </Text>
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
                {languages.map((l: PDFLanguage) => `${l.language} (${l.proficiency})`).join("  |  ")}
              </Text>
            </View>
          )}

          {awards?.length > 0 && vis.awards !== false && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Honors & Awards</Text>
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
        </View>

        <Text style={styles.footer}>— {resume.fullName} · Executive Resume —</Text>
      </Page>
    </Document>
  );
};
