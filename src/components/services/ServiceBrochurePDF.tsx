import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface BrochurePackage {
  name: string;
  price: number;
  description: string | null;
  deliveryTime: string | null;
  isPopular: boolean;
  features: string[];
}

interface BrochureService {
  title: string;
  slug: string;
  shortDescription: string | null;
  startingPrice: number | null;
  estimatedTimeline: string | null;
  features: string[];
  benefits: string[];
  technologies: string[];
  deliverables: string[];
  category: { name: string } | null;
  packages: BrochurePackage[];
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  header: { textAlign: "center", marginBottom: 24, borderBottom: "2 solid #e4e4e7", paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#71717a", marginBottom: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", borderBottom: "1 solid #e4e4e7", paddingBottom: 6, marginBottom: 10 },
  gridRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  feature: { padding: "6 10", backgroundColor: "#f4f4f5", borderRadius: 4, fontSize: 11 },
  techPill: { padding: "4 10", backgroundColor: "#f4f4f5", borderRadius: 12, fontSize: 10, marginRight: 4, marginBottom: 4 },
  packageCard: { border: "1 solid #e4e4e7", borderRadius: 6, padding: 14, marginBottom: 10 },
  packageName: { fontSize: 14, fontWeight: "bold", marginBottom: 2 },
  price: { fontSize: 22, fontWeight: "bold", color: "#2563eb", marginBottom: 4 },
  packageDesc: { fontSize: 11, color: "#71717a", marginBottom: 6 },
  packageMeta: { fontSize: 10, color: "#71717a", marginBottom: 4 },
  featureList: { fontSize: 11, marginLeft: 16 },
  featureItem: { marginBottom: 2 },
  footer: { textAlign: "center", borderTop: "2 solid #e4e4e7", paddingTop: 16, fontSize: 10, color: "#71717a", marginTop: 20 },
  badge: { backgroundColor: "#2563eb", color: "white", fontSize: 9, padding: "2 8", borderRadius: 10, alignSelf: "flex-start", marginBottom: 6 },
});

export default function ServiceBrochurePDF({ service }: { service: BrochureService }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{service.title}</Text>
          {service.shortDescription && (
            <Text style={styles.subtitle}>{service.shortDescription}</Text>
          )}
          {service.startingPrice && (
            <Text style={styles.subtitle}>
              Starting at ${service.startingPrice.toLocaleString()}
            </Text>
          )}
          {service.estimatedTimeline && (
            <Text style={styles.subtitle}>
              Estimated Timeline: {service.estimatedTimeline}
            </Text>
          )}
        </View>

        {service.features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.gridRow}>
              {service.features.map((f, i) => (
                <Text key={i} style={styles.feature}>{f}</Text>
              ))}
            </View>
          </View>
        )}

        {service.benefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Benefits</Text>
            <View style={styles.gridRow}>
              {service.benefits.map((b, i) => (
                <Text key={i} style={styles.feature}>{b}</Text>
              ))}
            </View>
          </View>
        )}

        {service.technologies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Technologies</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {service.technologies.map((t, i) => (
                <Text key={i} style={styles.techPill}>{t}</Text>
              ))}
            </View>
          </View>
        )}

        {service.deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            {service.deliverables.map((d, i) => (
              <Text key={i} style={styles.featureItem}>• {d}</Text>
            ))}
          </View>
        )}

        {service.packages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing Packages</Text>
            {service.packages.map((pkg, i) => (
              <View key={i} style={styles.packageCard}>
                {pkg.isPopular && <Text style={styles.badge}>Most Popular</Text>}
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.price}>${pkg.price.toLocaleString()}</Text>
                {pkg.description && (
                  <Text style={styles.packageDesc}>{pkg.description}</Text>
                )}
                {pkg.deliveryTime && (
                  <Text style={styles.packageMeta}>Delivery: {pkg.deliveryTime}</Text>
                )}
                {pkg.features.length > 0 && (
                  <View style={styles.featureList}>
                    {pkg.features.map((f, j) => (
                      <Text key={j} style={styles.featureItem}>• {f}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text>{service.title} — {service.category?.name ?? ""}</Text>
          <Text>Contact: hello@emmettanthony.dev</Text>
        </View>
      </Page>
    </Document>
  );
}
