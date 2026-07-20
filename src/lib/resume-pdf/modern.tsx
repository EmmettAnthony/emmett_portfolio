import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate, PDFTemplateProps, PDFExperience, PDFEducation, PDFSkill, PDFCertification, PDFAward, PDFLanguage } from "./shared";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: "#555",
    marginBottom: 4,
  },
  contactRow: {
    fontSize: 9,
    color: "#777",
    flexDirection: "row" as const,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginTop: 16,
    marginBottom: 8,
    color: "#2563eb",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 2,
  },
  section: {
    marginBottom: 6,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 8,
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
    fontSize: 11,
  },
  expCompany: {
    fontSize: 10,
    color: "#555",
  },
  expDate: {
    fontSize: 9,
    color: "#777",
  },
  bulletList: {
    marginTop: 4,
  },
  bullet: {
    fontSize: 9,
    marginBottom: 1,
    paddingLeft: 10,
  },
  techText: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
  eduBlock: {
    marginBottom: 6,
  },
  eduInstitution: {
    fontWeight: 700,
    fontSize: 11,
  },
  eduDetail: {
    fontSize: 10,
    color: "#555",
  },
  eduDate: {
    fontSize: 9,
    color: "#777",
  },
  skillsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 4,
  },
  skillPill: {
    fontSize: 9,
    backgroundColor: "#f0f0f0",
    padding: "2px 6px",
    borderRadius: 3,
  },
  certBlock: {
    marginBottom: 4,
  },
  certName: {
    fontWeight: 700,
    fontSize: 10,
  },
  certOrg: {
    fontSize: 9,
    color: "#555",
  },
  langRow: {
    fontSize: 10,
  },
});

export const ModernPDF: React.FC<PDFTemplateProps> = ({ resume, experiences, education, skills, certifications, awards, languages }) => {
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
            <Text style={styles.sectionTitle}>Professional Summary</Text>
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
                  {responsibilities.length > 0 && (
                    <View style={styles.bulletList}>
                      {responsibilities.map((r: string, i: number) => (
                        <Text key={i} style={styles.bullet}>• {r}</Text>
                      ))}
                    </View>
                  )}
                  {technologies.length > 0 && (
                    <Text style={styles.techText}>{technologies.join(", ")}</Text>
                  )}
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
            <View style={styles.skillsContainer}>
              {skills.map((skill: PDFSkill) => (
                <Text key={skill.id} style={styles.skillPill}>
                  {skill.name}
                </Text>
              ))}
            </View>
          </View>
        )}

        {certifications?.length > 0 && vis.certifications !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {certifications.map((cert: PDFCertification) => (
              <View key={cert.id} style={styles.certBlock}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certOrg}>{cert.organization} • {formatDate(cert.issueDate)}</Text>
              </View>
            ))}
          </View>
        )}

        {languages?.length > 0 && vis.languages !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.langRow}>
              {languages.map((l: PDFLanguage) => `${l.language} (${l.proficiency})`).join(", ")}
            </Text>
          </View>
        )}

        {awards?.length > 0 && vis.awards !== false && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Awards</Text>
            {awards.map((award: PDFAward) => (
              <View key={award.id} style={styles.certBlock}>
                <Text style={styles.certName}>{award.title}</Text>
                <Text style={styles.certOrg}>
                  {award.organization}{award.date ? ` • ${formatDate(award.date)}` : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};
