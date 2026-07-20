import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatDate, PDFTemplateProps, PDFExperience, PDFEducation, PDFSkill, PDFCertification, PDFAward, PDFLanguage } from "./shared";

const SIDEBAR_W = 35;
const ACCENT = "#1e3a5f";

const styles = StyleSheet.create({
  page: {
    flexDirection: "row" as const,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
  },
  sidebar: {
    width: `${SIDEBAR_W}%` as unknown as number,
    backgroundColor: ACCENT,
    padding: 20,
    paddingTop: 30,
    minHeight: "100%" as unknown as number,
  },
  content: {
    width: `${100 - SIDEBAR_W}%` as unknown as number,
    padding: 24,
  },
  sidebarName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 2,
  },
  sidebarTitle: {
    fontSize: 10,
    color: "#94a3b8",
    marginBottom: 16,
  },
  sidebarDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#3b5a82",
    marginBottom: 16,
  },
  sidebarSectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  contactItem: {
    fontSize: 8,
    color: "#cbd5e1",
    marginBottom: 3,
  },
  sidebarSkill: {
    fontSize: 8,
    color: "#cbd5e1",
    marginBottom: 2,
  },
  sidebarLang: {
    fontSize: 8,
    color: "#cbd5e1",
    marginBottom: 2,
  },
  sidebarCert: {
    fontSize: 8,
    color: "#cbd5e1",
    marginBottom: 2,
  },
  contentName: {
    fontSize: 10,
    color: ACCENT,
    fontWeight: 700,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: ACCENT,
    borderBottomWidth: 1,
    borderBottomColor: ACCENT,
    paddingBottom: 2,
    marginTop: 14,
    marginBottom: 8,
  },
  text: {
    fontSize: 9,
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
    fontSize: 10,
  },
  expCompany: {
    fontSize: 9,
    color: "#555",
  },
  expDate: {
    fontSize: 8,
    color: "#777",
  },
  bullet: {
    fontSize: 8,
    marginBottom: 1,
    paddingLeft: 8,
  },
  eduBlock: {
    marginBottom: 6,
  },
  eduInstitution: {
    fontWeight: 700,
    fontSize: 10,
  },
  eduDetail: {
    fontSize: 9,
    color: "#555",
  },
  eduDate: {
    fontSize: 8,
    color: "#777",
  },
  awardBlock: {
    marginBottom: 4,
  },
  awardName: {
    fontSize: 9,
    fontWeight: 700,
  },
  awardOrg: {
    fontSize: 8,
    color: "#555",
  },
});

export const CorporatePDF: React.FC<PDFTemplateProps> = ({ resume, experiences, education, skills, certifications, awards, languages }) => {
  const vis = resume.visibility ?? {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarName}>{resume.fullName}</Text>
          <Text style={styles.sidebarTitle}>{resume.professionalTitle}</Text>
          <View style={styles.sidebarDivider} />

          <Text style={styles.sidebarSectionTitle}>Contact</Text>
          {resume.location && <Text style={styles.contactItem}>{resume.location}</Text>}
          {resume.email && <Text style={styles.contactItem}>{resume.email}</Text>}
          {resume.phone && <Text style={styles.contactItem}>{resume.phone}</Text>}
          {resume.website && <Text style={styles.contactItem}>{resume.website}</Text>}

          <View style={styles.sidebarDivider} />

          {skills?.length > 0 && vis.skills !== false && (
            <>
              <Text style={styles.sidebarSectionTitle}>Skills</Text>
              {skills.map((s: PDFSkill) => (
                <Text key={s.id} style={styles.sidebarSkill}>• {s.name}</Text>
              ))}
            </>
          )}

          {certifications?.length > 0 && vis.certifications !== false && (
            <>
              <Text style={styles.sidebarSectionTitle}>Certifications</Text>
              {certifications.map((c: PDFCertification) => (
                <Text key={c.id} style={styles.sidebarCert}>• {c.name}</Text>
              ))}
            </>
          )}

          {languages?.length > 0 && vis.languages !== false && (
            <>
              <Text style={styles.sidebarSectionTitle}>Languages</Text>
              {languages.map((l: PDFLanguage) => (
                <Text key={l.id} style={styles.sidebarLang}>• {l.language} ({l.proficiency})</Text>
              ))}
            </>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.contentName}>{resume.fullName}</Text>

          {resume.summary && vis.summary !== false && (
            <View>
              <Text style={styles.sectionTitle}>Professional Summary</Text>
              <Text style={styles.text}>{resume.summary}</Text>
            </View>
          )}

          {experiences?.length > 0 && vis.experience !== false && (
            <View>
              <Text style={styles.sectionTitle}>Experience</Text>
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
                      <Text key={i} style={styles.bullet}>• {r}</Text>
                    ))}
                  </View>
                );
              })}
            </View>
          )}

          {education?.length > 0 && vis.education !== false && (
            <View>
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

          {awards?.length > 0 && vis.awards !== false && (
            <View>
              <Text style={styles.sectionTitle}>Awards</Text>
              {awards.map((a: PDFAward) => (
                <View key={a.id} style={styles.awardBlock}>
                  <Text style={styles.awardName}>{a.title}</Text>
                  <Text style={styles.awardOrg}>
                    {a.organization}{a.date ? ` • ${formatDate(a.date)}` : ""}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};
