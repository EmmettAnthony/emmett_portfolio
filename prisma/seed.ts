import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { UTApi } from "uploadthing/server";
import { fileURLToPath } from "url";
import { resolve } from "path";

const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/neondb";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
const utapi = new UTApi();

async function uploadImage(url: string): Promise<string | null> {
  try {
    const [file] = await utapi.uploadFilesFromUrl([url]);
    if (file?.error) throw new Error(file.error.message);
    return file?.data?.ufsUrl ?? file?.data?.url ?? null;
  } catch (err) {
    console.warn(`  ⚠ Failed to upload image: ${url}`, err);
    return url;
  }
}

async function main() {
  console.log("Seeding database...");

  await prisma.newsletterSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      defaultSenderName: "Emmett Anthony",
      defaultSenderEmail: "emmetta.dev@outlook.com",
      replyToEmail: "emmetta.dev@outlook.com",
      dailySendLimit: 500,
      weeklySendLimit: 3000,
      monthlySendLimit: 12000,
      doubleOptIn: true,
      trackOpens: true,
      trackClicks: true,
      gdprEnabled: true,
      footerHtml: `<p style="font-size:12px;color:#9ca3af;text-align:center">
  You are receiving this email because you subscribed to Emmett Anthony's newsletter.
  <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
</p>`,
    },
  });

  console.log("  ✓ Newsletter settings created");

  const templates = [
    {
      name: "Company Newsletter",
      description: "Monthly company updates and news",
      category: "company_newsletter",
      content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#1e40af,#3b82f6)">
              <h1 style="margin:0;font-size:24px;color:#ffffff;text-align:center">Company Newsletter</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#bfdbfe;text-align:center">Stay up to date with the latest</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              <h2 style="margin:0 0 16px;font-size:18px;color:#111827">What's New This Month</h2>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">
                We've been hard at work bringing you the latest updates and improvements. Here's a quick look at what we've been up to.
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">
                Our team has launched several new features designed to make your experience even better. We're excited to share these with you and look forward to your feedback.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:16px 0">
                    <a href="https://emmetta.dev" style="display:inline-block;padding:12px 32px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Read More</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">
                You are receiving this email because you subscribed to our newsletter.
                <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    {
      name: "Product Update",
      description: "Latest product features and improvements",
      category: "product_update",
      content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px">
              <h1 style="margin:0 0 8px;font-size:22px;color:#111827">New Features Just Landed</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280">Here's what's new in our latest release</p>
              <div style="margin-bottom:24px;padding:20px;background-color:#f0f9ff;border-radius:8px">
                <h3 style="margin:0 0 8px;font-size:16px;color:#1e40af">Feature Spotlight</h3>
                <p style="margin:0;font-size:14px;line-height:1.5;color:#374151">
                  We've completely redesigned the dashboard to make it faster and more intuitive. Check out the new workflow.
                </p>
              </div>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#374151">
                We've also fixed several bugs and improved performance across the board. Update to the latest version to take advantage of all improvements.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://emmetta.dev" style="display:inline-block;padding:12px 32px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">See What's New</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">
                You are receiving this email because you subscribed to product updates.
                <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    {
      name: "Blog Digest",
      description: "Weekly roundup of latest blog posts",
      category: "blog_digest",
      content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#111827,#374151)">
              <h1 style="margin:0;font-size:24px;color:#ffffff;text-align:center">Blog Digest</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#d1d5db;text-align:center">Weekly roundup of our latest articles</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              <div style="margin-bottom:24px;padding:20px;border:1px solid #e5e7eb;border-radius:8px">
                <h3 style="margin:0 0 4px;font-size:16px;color:#111827">Understanding Modern CSS</h3>
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280">A deep dive into container queries, cascade layers, and modern layout techniques.</p>
                <a href="https://emmetta.dev/blog" style="font-size:13px;color:#3b82f6;text-decoration:none;font-weight:500">Read More →</a>
              </div>
              <div style="margin-bottom:24px;padding:20px;border:1px solid #e5e7eb;border-radius:8px">
                <h3 style="margin:0 0 4px;font-size:16px;color:#111827">Building Accessible Forms</h3>
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280">Best practices for creating forms that work for everyone.</p>
                <a href="https://emmetta.dev/blog" style="font-size:13px;color:#3b82f6;text-decoration:none;font-weight:500">Read More →</a>
              </div>
              <div style="padding:20px;border:1px solid #e5e7eb;border-radius:8px">
                <h3 style="margin:0 0 4px;font-size:16px;color:#111827">React Server Components</h3>
                <p style="margin:0 0 12px;font-size:13px;color:#6b7280">How RSC changes the way we think about React applications.</p>
                <a href="https://emmetta.dev/blog" style="font-size:13px;color:#3b82f6;text-decoration:none;font-weight:500">Read More →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">
                You are receiving this email because you subscribed to our blog digest.
                <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    {
      name: "Announcement",
      description: "Important announcements and updates",
      category: "announcement",
      content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#991b1b,#ef4444)">
              <h1 style="margin:0;font-size:26px;color:#ffffff;text-align:center">Big News</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              <h2 style="margin:0 0 16px;font-size:20px;color:#111827;text-align:center">We're excited to announce a major milestone!</h2>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">
                After months of hard work and dedication, we are thrilled to share some exciting news with our community. This announcement marks a new chapter in our journey.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#374151">
                Thank you for being part of this journey. We couldn't have done it without your support.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://emmetta.dev" style="display:inline-block;padding:12px 32px;background-color:#ef4444;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Learn More</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">
                You are receiving this email because you subscribed to our newsletter.
                <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    {
      name: "Promotion",
      description: "Special offers and promotions",
      category: "promotion",
      content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#065f46,#10b981);text-align:center">
              <h1 style="margin:0;font-size:28px;color:#ffffff">Special Offer</h1>
              <p style="margin:8px 0 0;font-size:16px;color:#a7f3d0">Limited time only</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center">
              <div style="display:inline-block;background-color:#fef3c7;padding:16px 32px;border-radius:8px;margin-bottom:24px">
                <span style="font-size:36px;font-weight:800;color:#d97706">20% OFF</span>
              </div>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">
                For a limited time, we're offering an exclusive discount to our subscribers. Don't miss out on this opportunity to save big on our services.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#374151">
                Use code <strong style="color:#065f46">WELCOME20</strong> at checkout.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://emmetta.dev" style="display:inline-block;padding:14px 36px;background-color:#10b981;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600">Shop Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">
                You are receiving this email because you opted in to promotional emails.
                <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    {
      name: "Event Invitation",
      description: "Event invitations and reminders",
      category: "event",
      content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#6d28d9,#8b5cf6);text-align:center">
              <h1 style="margin:0;font-size:24px;color:#ffffff">You're Invited!</h1>
              <p style="margin:8px 0 0;font-size:14px;color:#ddd6fe">Join us for an exclusive event</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              <h2 style="margin:0 0 8px;font-size:20px;color:#111827;text-align:center">Web Development Summit 2025</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#6b7280;text-align:center">March 15, 2025 · Virtual Event</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">
                We're excited to invite you to our upcoming event featuring industry leaders, hands-on workshops, and networking opportunities.
              </p>
              <div style="margin-bottom:24px;padding:16px;background-color:#f5f3ff;border-radius:8px">
                <p style="margin:0 0 4px;font-size:13px;color:#6d28d9"><strong>What to expect:</strong></p>
                <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">
                  Keynote speeches · Technical workshops · Panel discussions · Networking sessions
                </p>
              </div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://emmetta.dev" style="display:inline-block;padding:12px 32px;background-color:#8b5cf6;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">RSVP Now</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:12px;color:#9ca3af">
                You are receiving this email because you subscribed to event notifications.
                <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
    {
      name: "Welcome Email",
      description: "Welcome message for new subscribers",
      category: "custom",
      content: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
          <tr>
            <td style="padding:32px 40px;background:linear-gradient(135deg,#1e40af,#3b82f6);text-align:center">
              <h1 style="margin:0;font-size:24px;color:#ffffff">Welcome to the Community!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px">
              <p style="font-size:14px;color:#6b7280;margin:0 0 16px">Hi {{firstName}},</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">
                Welcome! I'm Emmett Anthony, and I'm thrilled to have you join my newsletter community.
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#374151">
                Every week, I share insights about web development, design, and technology. You'll receive curated content, exclusive tips, and early access to new projects and articles.
              </p>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#374151">
                Here's what you can expect:
              </p>
              <ul style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#374151;padding-left:20px">
                <li>Weekly blog digests with the latest articles</li>
                <li>Exclusive tips and tutorials</li>
                <li>Early access to new projects</li>
                <li>Special offers and promotions</li>
              </ul>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://emmetta.dev" style="display:inline-block;padding:12px 32px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Explore the Blog</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f9fafb;text-align:center">
              <p style="margin:0;font-size:14px;color:#374151">Best regards,</p>
              <p style="margin:4px 0 0;font-size:14px;font-weight:600;color:#111827">Emmett Anthony</p>
              <p style="margin:16px 0 0;font-size:12px;color:#9ca3af">
                If you didn't sign up for this newsletter, please ignore this email.
                <br><a href="{{unsubscribe_url}}" style="color:#3b82f6">Unsubscribe here</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: template.name, isBuiltIn: true },
    });
    if (!existing) {
      await prisma.template.create({
        data: { ...template, isBuiltIn: true },
      });
    }
  }

  console.log(`  ✓ ${templates.length} built-in templates created`);

  const segments = [
    {
      name: "Web Development Leads",
      slug: "web-dev-leads",
      description: "Subscribers interested in web development topics",
      criteria: {
        tags: { contains: "web-development" },
        sources: ["blog_sidebar", "footer"],
        status: ["ACTIVE"],
      },
    },
    {
      name: "Active Subscribers",
      slug: "active-subscribers",
      description: "Active subscribers with high engagement",
      criteria: {
        status: ["ACTIVE"],
        activityLevel: "active",
      },
    },
  ];

  for (const segment of segments) {
    const existing = await prisma.segment.findUnique({
      where: { slug: segment.slug },
    });
    if (!existing) {
      await prisma.segment.create({
        data: segment,
      });
    }
  }

  console.log(`  ✓ ${segments.length} segments created`);

  // Service Categories
  const categoryData = [
    { name: "Web Development", slug: "web-development", description: "Professional website and web application development services.", icon: "🌐", order: 1 },
    { name: "E-Commerce Development", slug: "ecommerce-development", description: "Custom online store and e-commerce platform development.", icon: "🛒", order: 2 },
    { name: "Software Development", slug: "software-development", description: "Custom software solutions and SaaS applications.", icon: "⚡", order: 3 },
    { name: "WordPress Development", slug: "wordpress-development", description: "WordPress website, theme, and plugin development.", icon: "📝", order: 4 },
    { name: "Technical Consulting", slug: "technical-consulting", description: "Technology strategy, architecture, and optimization consulting.", icon: "💡", order: 5 },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categoryData) {
    const existing = await prisma.serviceCategory.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      createdCategories[cat.slug] = existing.id;
    } else {
      const created = await prisma.serviceCategory.create({ data: cat });
      createdCategories[cat.slug] = created.id;
    }
  }
  console.log(`  ✓ ${categoryData.length} service categories created`);

  // Seed Web Development Service
  const webDevSlug = "web-development";
  const existingWebDev = await prisma.service.findUnique({ where: { slug: webDevSlug } });
  if (!existingWebDev && createdCategories["web-development"]) {
    await prisma.service.create({
      data: {
        title: "Web Development",
        slug: webDevSlug,
        shortDescription: "Custom-built websites and web applications using modern frameworks and best practices.",
        fullDescription: "<p>I build fast, responsive, and user-friendly websites and web applications using cutting-edge technologies. From simple landing pages to complex web platforms, every project is crafted with attention to performance, accessibility, and user experience.</p><p>My development process follows industry best practices including component-based architecture, server-side rendering, progressive enhancement, and comprehensive testing to ensure your website delivers exceptional results.</p>",
        categoryId: createdCategories["web-development"],
        icon: "🌐",
        galleryImages: [],
        testimonialIds: [],
        features: ["Responsive Design", "Fast Performance", "SEO Optimized", "Accessibility Compliant", "CMS Integration", "Analytics Setup", "Contact Forms", "Blog Integration"],
        benefits: ["Increased online visibility", "Higher conversion rates", "Better user engagement", "Improved search rankings", "Faster page load times", "Mobile-friendly experience"],
        technologies: ["Next.js", "React", "TypeScript", "Tailwind CSS", "PostgreSQL", "Node.js"],
        deliverables: ["Fully functional website", "Source code repository", "Deployment setup", "Documentation", "Admin training session"],
        estimatedTimeline: "2-4 weeks",
        startingPrice: 1500,
        featured: true,
        published: true,
        order: 1,
        metaTitle: "Web Development Services | Emmett Anthony",
        metaDescription: "Professional web development services including business websites, corporate sites, landing pages, and web applications.",
        tags: ["react", "nextjs", "typescript", "tailwind", "responsive"],
        packages: {
          create: [
            {
              name: "Starter",
              description: "Perfect for small businesses and startups",
              price: 1500,
              features: ["5 Pages", "Responsive Design", "Contact Form", "Basic SEO", "1 Month Support"],
              deliveryTime: "2 weeks",
              revisions: 2,
              supportDuration: "1 month",
              isPopular: false,
              order: 1,
            },
            {
              name: "Professional",
              description: "Best for growing businesses",
              price: 3500,
              features: ["10 Pages", "Custom Design", "CMS Integration", "Blog Setup", "Analytics", "3 Months Support"],
              deliveryTime: "3 weeks",
              revisions: 3,
              supportDuration: "3 months",
              isPopular: true,
              order: 2,
            },
            {
              name: "Enterprise",
              description: "For large-scale applications",
              price: 7500,
              features: ["Unlimited Pages", "Custom Web App", "API Development", "Admin Dashboard", "Priority Support", "12 Months Support"],
              deliveryTime: "6 weeks",
              revisions: 5,
              supportDuration: "12 months",
              isPopular: false,
              order: 3,
            },
          ],
        },
        faqs: {
          create: [
            { question: "How long does a typical website take?", answer: "A standard business website typically takes 2-4 weeks from concept to launch. More complex web applications can take 6-12 weeks depending on the feature set.", order: 1 },
            { question: "Do you provide hosting?", answer: "I recommend and can set up hosting on Vercel, AWS, or your preferred provider. I handle the deployment and provide documentation for ongoing management.", order: 2 },
            { question: "Can you redesign my existing website?", answer: "Absolutely! I specialize in redesigning and modernizing existing websites. I'll audit your current site and create a plan to improve performance, design, and user experience.", order: 3 },
          ],
        },
      },
    });
    console.log("  ✓ Web Development service created");
  }

  // Seed E-Commerce Service
  const ecomSlug = "ecommerce-development";
  const existingEcom = await prisma.service.findUnique({ where: { slug: ecomSlug } });
  if (!existingEcom && createdCategories["ecommerce-development"]) {
    await prisma.service.create({
      data: {
        title: "E-Commerce Development",
        slug: ecomSlug,
        shortDescription: "Custom online stores and e-commerce platforms with secure payment processing and inventory management.",
        fullDescription: "<p>I create powerful e-commerce solutions that drive sales and provide seamless shopping experiences. Whether you need a simple online store or a complex multi-vendor marketplace, I build scalable platforms with secure payment processing, inventory management, and analytics.</p><p>Each e-commerce solution is optimized for conversion with fast load times, intuitive navigation, and mobile-first design.</p>",
        categoryId: createdCategories["ecommerce-development"],
        icon: "🛒",
        galleryImages: [],
        testimonialIds: [],
        features: ["Product Management", "Shopping Cart", "Secure Checkout", "Payment Integration", "Inventory Tracking", "Order Management", "Customer Accounts", "Analytics Dashboard"],
        benefits: ["Increase online sales", "Streamlined operations", "Secure transactions", "Better customer insights", "Scalable infrastructure", "Multi-currency support"],
        technologies: ["Next.js", "React", "TypeScript", "Stripe", "PostgreSQL", "Tailwind CSS"],
        deliverables: ["Fully functional online store", "Payment gateway integration", "Product catalog setup", "Admin dashboard", "Deployment and documentation"],
        estimatedTimeline: "4-8 weeks",
        startingPrice: 3000,
        featured: true,
        published: true,
        order: 2,
        metaTitle: "E-Commerce Development Services | Emmett Anthony",
        metaDescription: "Professional e-commerce development services including online stores, WooCommerce, and custom platforms.",
        tags: ["ecommerce", "shop", "stripe", "payment", "online-store"],
        packages: {
          create: [
            {
              name: "Starter Store",
              description: "For small online businesses",
              price: 3000,
              features: ["Up to 50 Products", "Payment Integration", "Basic Inventory", "Shopping Cart", "1 Month Support"],
              deliveryTime: "4 weeks",
              revisions: 2,
              supportDuration: "1 month",
              isPopular: false,
              order: 1,
            },
            {
              name: "Business Store",
              description: "For growing e-commerce brands",
              price: 6000,
              features: ["Up to 500 Products", "Advanced Inventory", "Customer Accounts", "Order Management", "Analytics", "3 Months Support"],
              deliveryTime: "6 weeks",
              revisions: 3,
              supportDuration: "3 months",
              isPopular: true,
              order: 2,
            },
            {
              name: "Enterprise Platform",
              description: "For large-scale operations",
              price: 15000,
              features: ["Unlimited Products", "Multi-vendor Support", "Advanced Analytics", "API Integration", "Priority Support", "12 Months Support"],
              deliveryTime: "10 weeks",
              revisions: 5,
              supportDuration: "12 months",
              isPopular: false,
              order: 3,
            },
          ],
        },
        faqs: {
          create: [
            { question: "Which payment gateways do you integrate?", answer: "I integrate with Stripe, PayPal, Square, and other major payment processors. I can also set up recurring billing for subscription-based models.", order: 1 },
            { question: "Can you migrate my existing store?", answer: "Yes, I handle migrations from Shopify, WooCommerce, Magento, and other platforms. I ensure all products, customers, and order history are transferred securely.", order: 2 },
          ],
        },
      },
    });
    console.log("  ✓ E-Commerce Development service created");
  }

  // Seed Software Development Service
  const softwareSlug = "software-development";
  const existingSoftware = await prisma.service.findUnique({ where: { slug: softwareSlug } });
  if (!existingSoftware && createdCategories["software-development"]) {
    await prisma.service.create({
      data: {
        title: "Software Development",
        slug: softwareSlug,
        shortDescription: "Custom software applications, management systems, and SaaS platforms built for scale.",
        fullDescription: "<p>I develop custom software solutions tailored to your specific business needs. From internal management systems to customer-facing SaaS applications, I build robust, scalable, and maintainable software using modern architectures.</p><p>My approach focuses on clean code, comprehensive testing, and iterative development to deliver high-quality software that evolves with your business.</p>",
        categoryId: createdCategories["software-development"],
        icon: "⚡",
        galleryImages: [],
        testimonialIds: [],
        features: ["Custom Development", "API Integration", "Database Design", "Authentication & Authorization", "Admin Dashboard", "Reporting & Analytics", "Third-party Integrations", "Scalable Architecture"],
        benefits: ["Automated workflows", "Reduced operational costs", "Data-driven decisions", "Improved efficiency", "Competitive advantage", "Scalable growth"],
        technologies: ["Next.js", "React", "Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker"],
        deliverables: ["Custom software application", "API documentation", "Database schema", "Deployment pipeline", "Source code and documentation"],
        estimatedTimeline: "6-12 weeks",
        startingPrice: 5000,
        featured: true,
        published: true,
        order: 3,
        metaTitle: "Software Development Services | Emmett Anthony",
        metaDescription: "Custom software development including web applications, management systems, and SaaS platforms.",
        tags: ["software", "saas", "api", "web-app", "custom"],
        packages: {
          create: [
            {
              name: "MVP",
              description: "Minimum viable product to validate your idea",
              price: 5000,
              features: ["Core Features", "Basic UI/UX", "API Development", "Database Setup", "1 Month Support"],
              deliveryTime: "6 weeks",
              revisions: 2,
              supportDuration: "1 month",
              isPopular: false,
              order: 1,
            },
            {
              name: "Growth",
              description: "Full-featured application for scaling",
              price: 12000,
              features: ["All Core Features", "Advanced UI/UX", "Admin Dashboard", "Analytics", "Third-party Integrations", "3 Months Support"],
              deliveryTime: "10 weeks",
              revisions: 3,
              supportDuration: "3 months",
              isPopular: true,
              order: 2,
            },
          ],
        },
        faqs: {
          create: [
            { question: "Do you build mobile apps?", answer: "I specialize in web applications using responsive design and progressive web app techniques. For native mobile apps, I can recommend and collaborate with trusted partners.", order: 1 },
            { question: "How do you handle data security?", answer: "Security is built into every layer. I implement encryption, secure authentication, input validation, and follow OWASP best practices to protect your data.", order: 2 },
          ],
        },
      },
    });
    console.log("  ✓ Software Development service created");
  }

  // Seed Global FAQs
  const globalFaqs = [
    { question: "How long does a typical project take?", answer: "Project timelines vary based on scope and complexity. A standard website typically takes 2-4 weeks, while more complex web applications can take 6-12 weeks. I'll provide a detailed timeline during our initial consultation.", order: 1 },
    { question: "What technologies do you use?", answer: "I primarily work with Next.js, React, TypeScript, and Tailwind CSS for frontend development, with Node.js and PostgreSQL for the backend. I also have experience with WordPress, PHP, Laravel, and various other technologies based on project requirements.", order: 2 },
    { question: "Do you provide support after launch?", answer: "Yes! All my projects include a support period after launch. I offer ongoing maintenance and support packages to ensure your digital product continues to perform optimally.", order: 3 },
    { question: "Can you redesign an existing website?", answer: "Absolutely. I frequently redesign and modernize existing websites. I'll audit your current site, identify areas for improvement, and create a plan to enhance performance, design, and user experience.", order: 4 },
    { question: "Do you work with international clients?", answer: "Yes, I work with clients from around the world. I'm comfortable collaborating across different time zones and use modern communication tools to ensure smooth project management.", order: 5 },
    { question: "What is your development process?", answer: "My process follows seven key steps: Discovery, Planning, Design, Development, Testing, Launch, and Support. This structured approach ensures quality, transparency, and successful project delivery.", order: 6 },
  ];

  for (const faq of globalFaqs) {
    const existing = await prisma.serviceFAQ.findFirst({
      where: { question: faq.question, serviceId: null },
    });
    if (!existing) {
      await prisma.serviceFAQ.create({ data: faq });
    }
  }
  console.log(`  ✓ ${globalFaqs.length} global FAQs created`);

  await seedPortfolio();
  await seedResume();
  await seedCalendar();

  // ─── Support System ────────────────────────────────────────────────
  console.log("\n  ── Support System ──");

  const priorities = [
    { name: "Low", slug: "low", level: 0, color: "#6b7280" },
    { name: "Normal", slug: "normal", level: 10, color: "#3b82f6" },
    { name: "High", slug: "high", level: 20, color: "#f59e0b" },
    { name: "Urgent", slug: "urgent", level: 30, color: "#ef4444" },
    { name: "Critical", slug: "critical", level: 40, color: "#dc2626" },
  ];

  for (const p of priorities) {
    await prisma.supportPriority.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log(`  ✓ ${priorities.length} support priorities created`);

  const statuses = [
    { name: "Open", slug: "open", order: 0, isClosed: false, isDefault: true, color: "#3b82f6" },
    { name: "Pending", slug: "pending", order: 1, isClosed: false, isDefault: false, color: "#f59e0b" },
    { name: "Waiting on Client", slug: "waiting-on-client", order: 2, isClosed: false, isDefault: false, color: "#8b5cf6" },
    { name: "In Progress", slug: "in-progress", order: 3, isClosed: false, isDefault: false, color: "#06b6d4" },
    { name: "Resolved", slug: "resolved", order: 4, isClosed: false, isDefault: false, color: "#10b981" },
    { name: "Closed", slug: "closed", order: 5, isClosed: true, isDefault: false, color: "#6b7280" },
    { name: "Archived", slug: "archived", order: 6, isClosed: true, isDefault: false, color: "#374151" },
  ];

  for (const s of statuses) {
    await prisma.supportStatus.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${statuses.length} support statuses created`);

  const categories = [
    { name: "General Inquiry", slug: "general-inquiry", icon: "HelpCircle", color: "#6b7280", order: 0 },
    { name: "Technical Support", slug: "technical-support", icon: "Wrench", color: "#3b82f6", order: 0 },
    { name: "Website Issue", slug: "website-issue", icon: "Globe", color: "#f59e0b", order: 0 },
    { name: "Billing", slug: "billing", icon: "CreditCard", color: "#ef4444", order: 0 },
    { name: "Payment", slug: "payment", icon: "DollarSign", color: "#10b981", order: 0 },
    { name: "Project Update", slug: "project-update", icon: "RefreshCw", color: "#8b5cf6", order: 2 },
    { name: "Bug Report", slug: "bug-report", icon: "Bug", color: "#dc2626", order: 0 },
    { name: "Feature Request", slug: "feature-request", icon: "Lightbulb", color: "#f59e0b", order: 0 },
    { name: "Consultation", slug: "consultation", icon: "MessageCircle", color: "#06b6d4", order: 0 },
    { name: "Partnership", slug: "partnership", icon: "Handshake", color: "#8b5cf6", order: 0 },
    { name: "Other", slug: "other", icon: "MoreHorizontal", color: "#6b7280", order: 99 },
  ];

  for (const c of categories) {
    await prisma.supportCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log(`  ✓ ${categories.length} support categories created`);

  const macros = [
    { title: "Welcome", slug: "welcome", category: "welcome", body: "Welcome! Thank you for reaching out. How can I help you today?" },
    { title: "Password Reset", slug: "password-reset", category: "password_reset", body: "To reset your password, please visit the login page and click 'Forgot Password'. You'll receive an email with instructions." },
    { title: "Booking Issue", slug: "booking-issue", category: "booking", body: "I see you're having trouble with booking. Let me help you find a suitable time. Could you let me know your preferred date and time?" },
    { title: "Payment Received", slug: "payment-received", category: "payment", body: "Thank you for your payment! Your transaction has been processed successfully. You will receive a receipt via email shortly." },
    { title: "Project Started", slug: "project-started", category: "project_started", body: "Great news! Your project has been started. Our team will begin working on it right away. You'll receive regular updates on progress." },
    { title: "Project Completed", slug: "project-completed", category: "project_completed", body: "Your project has been completed! Please review the deliverables and let us know if you need any adjustments. We value your feedback!" },
  ];

  for (const m of macros) {
    await prisma.supportMacro.upsert({
      where: { slug: m.slug },
      update: {},
      create: m,
    });
  }
  console.log(`  ✓ ${macros.length} support macros created`);

  console.log("Seeding complete!");
}

async function seedPortfolio() {
  console.log("  🌱 Seeding portfolio data...");

  // --- Categories ---
  const categoryData = [
    { name: "Business Websites", slug: "business-websites" },
    { name: "E-Commerce", slug: "e-commerce" },
    { name: "Web Applications", slug: "web-applications" },
    { name: "WordPress Projects", slug: "wordpress-projects" },
    { name: "SaaS Applications", slug: "saas-applications" },
    { name: "Hotel Management", slug: "hotel-management" },
    { name: "School Management", slug: "school-management" },
    { name: "CRM Systems", slug: "crm-systems" },
    { name: "Mobile Applications", slug: "mobile-applications" },
    { name: "API Integrations", slug: "api-integrations" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoryData) {
    const existing = await prisma.portfolioCategory.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      categoryMap[cat.slug] = existing.id;
    } else {
      const created = await prisma.portfolioCategory.create({ data: cat });
      categoryMap[cat.slug] = created.id;
    }
  }
  console.log(`  ✓ ${categoryData.length} portfolio categories created`);

  // --- Technologies ---
  const technologyData = [
    { name: "Next.js", category: "frontend" },
    { name: "React", category: "frontend" },
    { name: "TypeScript", category: "frontend" },
    { name: "Node.js", category: "backend" },
    { name: "PHP", category: "backend" },
    { name: "Laravel", category: "backend" },
    { name: "WordPress", category: "cms" },
    { name: "MySQL", category: "database" },
    { name: "PostgreSQL", category: "database" },
    { name: "MongoDB", category: "database" },
    { name: "Tailwind CSS", category: "frontend" },
    { name: "Prisma", category: "backend" },
  ];

  const technologyMap: Record<string, string> = {};
  for (const tech of technologyData) {
    const slug = tech.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const existing = await prisma.technology.findUnique({ where: { slug } });
    if (existing) {
      technologyMap[tech.name] = existing.id;
    } else {
      const created = await prisma.technology.create({ data: { ...tech, slug } });
      technologyMap[tech.name] = created.id;
    }
  }
  console.log(`  ✓ ${technologyData.length} technologies created`);

  // --- Projects ---
  const projects = [
    {
      title: "Hotel Booking Platform",
      slug: "hotel-booking-platform",
      description: "A comprehensive hotel management system with real-time booking, inventory management, and analytics dashboard.",
      shortDescription: "A comprehensive hotel management system with real-time booking, inventory management, and analytics dashboard.",
      featuredImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
      galleryImages: [
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800",
        "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800",
      ],
      liveUrl: "https://example.com/hotel-booking",
      githubUrl: "https://github.com/emmett/hotel-booking",
      demoUrl: "https://demo.example.com/hotel",
      clientName: "Luxury Stays Inc.",
      clientIndustry: "Hospitality",
      clientTestimonial: "Emmett delivered an exceptional platform that transformed our booking operations. The real-time features and analytics dashboard exceeded our expectations.",
      startDate: new Date("2024-01-15"),
      completionDate: new Date("2024-06-30"),
      status: "COMPLETED",
      featured: true,
      published: true,
      teamSize: 4,
      tags: ["hotel", "booking", "real-time", "analytics"],
      viewCount: 1520,
      categorySlug: "hotel-management",
      technologyNames: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "Tailwind CSS"],
      metrics: [
        { label: "Users", value: "10K+" },
        { label: "Bookings", value: "50K+" },
        { label: "Uptime", value: "99.9%" },
      ],
      awards: [
        "Best Hotel Platform 2024 - Travel Tech Awards",
        "Innovation Award - Hospitality Summit 2024",
      ],
      caseStudySections: [
        { title: "The Challenge", content: "Luxury Stays Inc. was struggling with an outdated booking system that couldn't handle real-time inventory updates, leading to overbookings and poor customer experience.", order: 1 },
        { title: "The Solution", content: "We built a modern hotel management platform featuring real-time booking, dynamic pricing, inventory management, and a comprehensive analytics dashboard.", order: 2 },
        { title: "The Results", content: "The platform successfully handles 50K+ monthly bookings with 99.9% uptime, reducing overbookings by 95% and increasing direct bookings by 40%.", order: 3 },
      ],
    },
    {
      title: "School Management System",
      slug: "school-management-system",
      description: "Complete school management platform with student records, attendance tracking, grading, and parent communication.",
      shortDescription: "Complete school management platform with student records, attendance tracking, grading, and parent communication.",
      featuredImage: "https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=800",
      galleryImages: [
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
        "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
        "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800",
      ],
      liveUrl: "https://example.com/school-management",
      githubUrl: "https://github.com/emmett/school-management",
      demoUrl: "https://demo.example.com/school",
      clientName: "EduTech Solutions",
      clientIndustry: "Education",
      clientTestimonial: "The school management system streamlined our entire administrative workflow. Attendance tracking and grading are now effortless.",
      startDate: new Date("2024-03-01"),
      completionDate: new Date("2024-08-31"),
      status: "COMPLETED",
      featured: true,
      published: true,
      teamSize: 3,
      tags: ["school", "education", "management", "SaaS"],
      viewCount: 890,
      categorySlug: "school-management",
      technologyNames: ["React", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "Tailwind CSS"],
      metrics: [
        { label: "Students", value: "5K+" },
        { label: "Teachers", value: "200+" },
      ],
      awards: [],
      caseStudySections: [
        { title: "The Challenge", content: "EduTech Solutions needed a unified platform to replace disparate systems for student records, attendance, grading, and parent communication.", order: 1 },
        { title: "The Solution", content: "We developed a comprehensive school management platform with role-based access, real-time attendance tracking, automated grading, and parent portals.", order: 2 },
        { title: "The Results", content: "The platform serves 5K+ students and 200+ teachers, reducing administrative workload by 60% and improving parent engagement by 80%.", order: 3 },
      ],
    },
    {
      title: "E-Commerce Platform",
      slug: "e-commerce-platform",
      description: "Full-featured e-commerce platform with payment processing, inventory management, and multi-vendor support.",
      shortDescription: "Full-featured e-commerce platform with payment processing, inventory management, and multi-vendor support.",
      featuredImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
      galleryImages: [
        "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800",
        "https://images.unsplash.com/photo-1553729459-afe8f2e0d1b1?w=800",
      ],
      liveUrl: "https://example.com/ecommerce-platform",
      githubUrl: "https://github.com/emmett/ecommerce-platform",
      demoUrl: "https://demo.example.com/ecommerce",
      clientName: "ShopGlobal Co.",
      clientIndustry: "E-Commerce",
      clientTestimonial: "This platform took our online store to the next level. Multi-vendor support and payment processing are seamless.",
      startDate: new Date("2024-02-01"),
      completionDate: new Date("2024-07-31"),
      status: "COMPLETED",
      featured: false,
      published: true,
      teamSize: 5,
      tags: ["ecommerce", "shop", "payment", "multi-vendor"],
      viewCount: 2100,
      categorySlug: "e-commerce",
      technologyNames: ["Next.js", "React", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS"],
      metrics: [
        { label: "Products", value: "50K+" },
        { label: "Orders", value: "100K+" },
        { label: "Revenue", value: "$2M+" },
      ],
      awards: [],
      caseStudySections: [
        { title: "The Challenge", content: "ShopGlobal Co. needed a scalable e-commerce platform that could support multiple vendors, handle high traffic, and provide a seamless checkout experience.", order: 1 },
        { title: "The Solution", content: "We built a multi-vendor e-commerce platform with advanced product management, real-time inventory tracking, and integrated payment processing.", order: 2 },
        { title: "The Results", content: "The platform now supports 50K+ products, processes 100K+ monthly orders, and has generated $2M+ in revenue for vendors.", order: 3 },
      ],
    },
  ];

  for (const project of projects) {
    const existing = await prisma.portfolioProject.findUnique({ where: { slug: project.slug } });
    if (existing) continue;

    const categoryId = categoryMap[project.categorySlug];
    if (!categoryId) {
      console.warn(`  ⚠ Category "${project.categorySlug}" not found, skipping project "${project.title}"`);
      continue;
    }

    const technologyIds = project.technologyNames
      .map((name) => technologyMap[name])
      .filter((id): id is string => !!id);

    console.log(`  ⬆ Uploading images for "${project.title}"...`);
    const featuredImage = project.featuredImage ? await uploadImage(project.featuredImage) : null;
    const galleryImages: string[] = [];
    for (const url of project.galleryImages) {
      const uploaded = await uploadImage(url);
      if (uploaded) galleryImages.push(uploaded);
    }

    const created = await prisma.portfolioProject.create({
      data: {
        title: project.title,
        slug: project.slug,
        fullDescription: project.description,
        shortDescription: project.shortDescription,
        featuredImage,
        galleryImages,
        liveUrl: project.liveUrl,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        clientName: project.clientName,
        clientIndustry: project.clientIndustry,
        startDate: project.startDate,
        completionDate: project.completionDate,
        status: project.status,
        featured: project.featured,
        published: project.published,
        teamSize: project.teamSize,
        tags: project.tags,
        viewCount: project.viewCount,
        categoryId: categoryId,
        technologies: {
          connect: technologyIds.map((id) => ({ id })),
        },
        metrics: {
          create: project.metrics,
        },
        awards: project.awards,
        caseStudy: {
          create: {
            problemStatement: project.caseStudySections[0]?.content,
            solution: project.caseStudySections[1]?.content,
            results: project.caseStudySections[2]?.content,
          },
        },
      },
    });

    console.log(`  ✓ Project "${created.title}" created`);
  }

  console.log("  ✓ Portfolio seeding complete");
}

async function seedResume() {
  console.log("\n  ── Resume ──");

  const existing = await prisma.resumeProfile.findFirst();
  if (existing) {
    console.log("  ⏭ Resume already exists, skipping...");
    return;
  }

  const resume = await prisma.resumeProfile.create({
    data: {
      fullName: "Emmett Anthony",
      professionalTitle: "Professional Software Developer",
      location: "New York, NY",
      yearsOfExperience: 8,
      summary: "Building scalable websites, applications, and digital solutions that help businesses grow. Passionate about creating elegant, user-focused experiences with modern web technologies.",
      summaryTitle: "About Me",
      specializations: ["Web Development", "Software Development", "WordPress Development", "E-Commerce Solutions", "Business Applications"],
      socialLinks: [
        { label: "GitHub", url: "https://github.com/emmetta", icon: "github" },
        { label: "LinkedIn", url: "https://linkedin.com/in/emmetta", icon: "linkedin" },
        { label: "Twitter", url: "https://twitter.com/emmetta", icon: "twitter" },
      ],
      email: "emmetta.dev@outlook.com",
      website: "https://emmetta.dev",
      template: "modern",
      metaTitle: "Emmett Anthony - Professional Software Developer Resume",
      metaDescription: "Experienced software developer with 8+ years building web applications, e-commerce solutions, and business software.",
      published: true,
    },
  });

  // Experience
  await prisma.experience.createMany({
    data: [
      {
        resumeId: resume.id,
        jobTitle: "Senior Software Developer",
        company: "Tech Solutions Inc.",
        employmentType: "Full-Time",
        location: "New York, NY",
        startDate: new Date("2021-03-01"),
        current: true,
        responsibilities: [
          "Lead development of scalable web applications serving 100k+ users",
          "Architect and implement RESTful APIs and microservices",
          "Mentor junior developers and conduct code reviews",
          "Collaborate with cross-functional teams to define project requirements",
        ],
        achievements: [
          "Reduced application load time by 40% through optimization",
          "Led migration from legacy system to modern stack",
          "Implemented CI/CD pipeline reducing deployment time by 60%",
        ],
        technologies: ["Next.js", "React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
        order: 0,
      },
      {
        resumeId: resume.id,
        jobTitle: "Full Stack Developer",
        company: "Digital Agency Co.",
        employmentType: "Full-Time",
        location: "Brooklyn, NY",
        startDate: new Date("2018-06-01"),
        endDate: new Date("2021-02-28"),
        current: false,
        responsibilities: [
          "Built custom WordPress themes and plugins for clients",
          "Developed e-commerce solutions using WooCommerce",
          "Created responsive, accessible front-end interfaces",
          "Managed database design and optimization",
        ],
        achievements: [
          "Delivered 20+ client projects on time and within budget",
          "Increased client satisfaction score to 4.8/5",
          "Developed internal tool that saved 15 hours/week",
        ],
        technologies: ["PHP", "Laravel", "WordPress", "WooCommerce", "JavaScript", "MySQL"],
        order: 1,
      },
      {
        resumeId: resume.id,
        jobTitle: "Junior Web Developer",
        company: "Startup Labs",
        employmentType: "Full-Time",
        location: "Remote",
        startDate: new Date("2016-09-01"),
        endDate: new Date("2018-05-31"),
        current: false,
        responsibilities: [
          "Developed and maintained company website and web applications",
          "Implemented responsive designs and cross-browser compatibility",
          "Assisted in database management and API integration",
        ],
        achievements: [
          "Rebuilt company website resulting in 50% traffic increase",
          "Automated reporting system reducing manual work by 10 hours/week",
        ],
        technologies: ["React", "Node.js", "MongoDB", "Git"],
        order: 2,
      },
    ],
  });

  // Education
  await prisma.education.createMany({
    data: [
      {
        resumeId: resume.id,
        institution: "University of Technology",
        degree: "Bachelor of Science",
        fieldOfStudy: "Computer Science",
        startDate: new Date("2012-09-01"),
        endDate: new Date("2016-06-01"),
        grade: "3.8 GPA",
        description: "Focus on software engineering, data structures, and web technologies.",
        order: 0,
      },
    ],
  });

  // Skills
  const skillData = [
    { name: "Next.js", category: "Frontend", proficiency: 95, yearsOfExperience: 5 },
    { name: "React", category: "Frontend", proficiency: 92, yearsOfExperience: 6 },
    { name: "TypeScript", category: "Frontend", proficiency: 90, yearsOfExperience: 5 },
    { name: "JavaScript", category: "Frontend", proficiency: 95, yearsOfExperience: 8 },
    { name: "HTML5", category: "Frontend", proficiency: 98, yearsOfExperience: 8 },
    { name: "CSS3", category: "Frontend", proficiency: 90, yearsOfExperience: 8 },
    { name: "Tailwind CSS", category: "Frontend", proficiency: 88, yearsOfExperience: 4 },
    { name: "Node.js", category: "Backend", proficiency: 85, yearsOfExperience: 6 },
    { name: "PHP", category: "Backend", proficiency: 80, yearsOfExperience: 5 },
    { name: "Laravel", category: "Backend", proficiency: 75, yearsOfExperience: 4 },
    { name: "REST APIs", category: "Backend", proficiency: 90, yearsOfExperience: 6 },
    { name: "PostgreSQL", category: "Databases", proficiency: 85, yearsOfExperience: 6 },
    { name: "MySQL", category: "Databases", proficiency: 80, yearsOfExperience: 5 },
    { name: "MongoDB", category: "Databases", proficiency: 70, yearsOfExperience: 3 },
    { name: "WordPress", category: "CMS", proficiency: 88, yearsOfExperience: 6 },
    { name: "WooCommerce", category: "CMS", proficiency: 82, yearsOfExperience: 5 },
    { name: "Git", category: "Tools", proficiency: 90, yearsOfExperience: 8 },
    { name: "GitHub", category: "Tools", proficiency: 88, yearsOfExperience: 8 },
    { name: "Docker", category: "Tools", proficiency: 72, yearsOfExperience: 3 },
    { name: "VS Code", category: "Tools", proficiency: 95, yearsOfExperience: 7 },
  ];

  await prisma.skill.createMany({
    data: skillData.map((s, i) => ({ ...s, resumeId: resume.id, order: i })),
  });

  // Certifications
  await prisma.certification.createMany({
    data: [
      {
        resumeId: resume.id,
        name: "AWS Certified Solutions Architect",
        organization: "Amazon Web Services",
        issueDate: new Date("2023-06-15"),
        expiryDate: new Date("2026-06-15"),
        credentialId: "AWS-SAA-2023",
        credentialUrl: "https://aws.amazon.com/verify",
        order: 0,
      },
      {
        resumeId: resume.id,
        name: "Google Professional Cloud Developer",
        organization: "Google Cloud",
        issueDate: new Date("2022-11-01"),
        expiryDate: new Date("2025-11-01"),
        credentialId: "GCP-PCD-2022",
        credentialUrl: "https://cloud.google.com/learn/certification",
        order: 1,
      },
    ],
  });

  // Awards
  await prisma.award.createMany({
    data: [
      {
        resumeId: resume.id,
        title: "Employee of the Year",
        organization: "Tech Solutions Inc.",
        date: new Date("2023-12-15"),
        description: "Recognized for outstanding contributions to platform architecture and team leadership.",
        order: 0,
      },
      {
        resumeId: resume.id,
        title: "Best Web Application Award",
        organization: "Digital Summit 2022",
        date: new Date("2022-09-20"),
        description: "Awarded for innovative e-commerce solution serving 50k+ monthly active users.",
        order: 1,
      },
    ],
  });

  // Languages
  await prisma.language.createMany({
    data: [
      { resumeId: resume.id, language: "English", proficiency: "Native", order: 0 },
      { resumeId: resume.id, language: "French", proficiency: "Advanced", order: 1 },
      { resumeId: resume.id, language: "Spanish", proficiency: "Intermediate", order: 2 },
    ],
  });

  // References
  await prisma.reference.createMany({
    data: [
      {
        resumeId: resume.id,
        name: "Jane Smith",
        position: "CTO",
        organization: "Tech Solutions Inc.",
        email: "jane.smith@techsolutions.com",
        phone: "+1 (555) 123-4567",
        isPublic: true,
        order: 0,
      },
      {
        resumeId: resume.id,
        name: "John Davis",
        position: "Engineering Director",
        organization: "Digital Agency Co.",
        email: "john.davis@digitalagency.com",
        phone: "+1 (555) 987-6543",
        isPublic: true,
        order: 1,
      },
    ],
  });

  // Link some portfolio projects as featured
  const portfolioProjects = await prisma.portfolioProject.findMany({
    where: { published: true },
    take: 3,
  });

  if (portfolioProjects.length > 0) {
    await prisma.resumeFeaturedProject.createMany({
      data: portfolioProjects.map((p, i) => ({
        resumeId: resume.id,
        projectId: p.id,
        order: i,
      })),
    });
  }

  console.log("  ✓ Resume seeding complete");
}

export async function seedCalendar() {
  console.log("\n  ── Calendar ──");

  // ─── Meeting Types ───────────────────────────────────────────────────────
  const meetingTypes = [
    { name: "Free Consultation", slug: "free-consultation", description: "30-minute discovery call to discuss your project needs", duration: 30, color: "#3b82f6", icon: "phone", location: "virtual", order: 1 },
    { name: "Strategy Session", slug: "strategy-session", description: "Deep dive into project planning and technical strategy", duration: 60, color: "#8b5cf6", icon: "brain", location: "virtual", order: 2 },
    { name: "Project Kickoff", slug: "project-kickoff", description: "Kickoff meeting to align on project goals and timeline", duration: 45, color: "#10b981", icon: "rocket", location: "virtual", order: 3 },
    { name: "Code Review", slug: "code-review", description: "In-depth code review and architecture discussion", duration: 60, color: "#f59e0b", icon: "code-2", location: "virtual", order: 4 },
    { name: "In-Person Meeting", slug: "in-person-meeting", description: "Face-to-face meeting at my office", duration: 60, color: "#ef4444", icon: "building", location: "in-person", order: 5 },
  ];

  const createdMeetingTypes: Record<string, string> = {};
  for (const mt of meetingTypes) {
    const existing = await prisma.meetingType.findUnique({ where: { slug: mt.slug } });
    if (existing) {
      createdMeetingTypes[mt.slug] = existing.id;
    } else {
      const created = await prisma.meetingType.create({ data: mt });
      createdMeetingTypes[mt.slug] = created.id;
    }
  }
  console.log(`  ✓ ${meetingTypes.length} meeting types created`);

  // ─── Availability ────────────────────────────────────────────────────────
  const days = [
    { dayOfWeek: 0, isActive: false, startTime: "09:00", endTime: "17:00", slotDuration: 30 }, // Sun
    { dayOfWeek: 1, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },  // Mon
    { dayOfWeek: 2, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },  // Tue
    { dayOfWeek: 3, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },  // Wed
    { dayOfWeek: 4, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },  // Thu
    { dayOfWeek: 5, isActive: true, startTime: "09:00", endTime: "17:00", slotDuration: 30 },  // Fri
    { dayOfWeek: 6, isActive: false, startTime: "10:00", endTime: "15:00", slotDuration: 30 }, // Sat
  ];

  for (const day of days) {
    const existing = await prisma.availability.findUnique({ where: { dayOfWeek: day.dayOfWeek } });
    if (!existing) {
      await prisma.availability.create({ data: day });
    }
  }
  console.log("  ✓ Weekly availability created");

  // ─── Appointments ────────────────────────────────────────────────────────
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointmentData = [
    {
      name: "John Smith", email: "john@example.com", phone: "+1 (555) 111-1111",
      company: "Acme Corp", projectType: "Web Development",
      preferredDate: new Date(today.getTime() + 10 * 3600000), // today at 10am
      preferredTime: "10:00", duration: 30, status: "CONFIRMED", source: "WEBSITE", meetingTypeSlug: "free-consultation",
      message: "Interested in a new company website with CMS"
    },
    {
      name: "Sarah Johnson", email: "sarah@example.com", phone: "+1 (555) 222-2222",
      company: "TechStart Inc", projectType: "Software Development",
      preferredDate: new Date(today.getTime() + 14 * 3600000), // today at 2pm
      preferredTime: "14:00", duration: 60, status: "CONFIRMED", source: "WEBSITE", meetingTypeSlug: "strategy-session",
      message: "Need help planning our SaaS platform architecture"
    },
    {
      name: "Mike Chen", email: "mike@example.com",
      company: "DesignStudio", projectType: "E-Commerce",
      preferredDate: new Date(tomorrow.getTime() + 9 * 3600000), // tomorrow at 9am
      preferredTime: "09:00", duration: 45, status: "PENDING", source: "DASHBOARD", meetingTypeSlug: "project-kickoff",
      message: "Ready to start on the e-commerce store"
    },
    {
      name: "Emily Davis", email: "emily@example.com",
      company: "GrowthCo", projectType: "Web Development",
      preferredDate: new Date(nextWeek.getTime() + 11 * 3600000), // next week at 11am
      preferredTime: "11:00", duration: 30, status: "PENDING", source: "WEBSITE", meetingTypeSlug: "free-consultation",
      message: "Looking for a redesign of our marketing site"
    },
    {
      name: "Alex Wilson", email: "alex@example.com",
      company: "DataFlow Systems", projectType: "Software Development",
      preferredDate: new Date(nextWeek.getTime() + 15 * 3600000), // next week at 3pm
      preferredTime: "15:00", duration: 45, status: "CONFIRMED", source: "DASHBOARD", meetingTypeSlug: "code-review",
      message: "Need a code review of our main application"
    },
  ];

  let apptCount = 0;
  for (const appt of appointmentData) {
    const existing = await prisma.appointment.findFirst({
      where: { email: appt.email, preferredDate: appt.preferredDate },
    });
    if (existing) continue;

    const meetingTypeId = appt.meetingTypeSlug ? createdMeetingTypes[appt.meetingTypeSlug] : null;
    const createData = { ...appt };
    const appointment = await prisma.appointment.create({
      data: { ...createData, meetingTypeId },
    });

    // Create activity log
    await prisma.appointmentLog.create({
      data: {
        appointmentId: appointment.id,
        action: "CREATED",
        detail: `Appointment created by ${appt.source === "DASHBOARD" ? "admin" : appt.name}`,
      },
    });

    // Create corresponding calendar event
    const eventStart = new Date(appt.preferredDate);
    if (appt.preferredTime) {
      const [hours, minutes] = appt.preferredTime.split(":").map(Number);
      eventStart.setHours(hours, minutes, 0, 0);
    }
    const eventEnd = new Date(eventStart.getTime() + appt.duration * 60 * 1000);

    await prisma.calendarEvent.create({
      data: {
        title: `Appointment: ${appt.name}`,
        description: appt.message || null,
        startDate: eventStart,
        endDate: eventEnd,
        eventType: "CONSULTATION",
        status: appt.status === "CONFIRMED" ? "SCHEDULED" : "SCHEDULED",
        color: appt.status === "CONFIRMED" ? "#10b981" : "#f59e0b",
        meetingTypeId,
        appointmentId: appointment.id,
      },
    });

    apptCount++;
  }
  console.log(`  ✓ ${apptCount} appointments created`);

  // ─── Calendar Tasks ──────────────────────────────────────────────────────
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const twoDaysFromNow = new Date(today);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const taskData = [
    { title: "Review client proposal for Acme Corp", description: "Review and finalize the proposal before sending", dueDate: threeDaysAgo, priority: "HIGH", status: "PENDING", category: "work", color: "#ef4444" },
    { title: "Update portfolio homepage design", description: "Refresh the hero section with new projects", dueDate: lastWeek, priority: "MEDIUM", status: "IN_PROGRESS", progress: 60, category: "work", color: "#f59e0b" },
    { title: "Prepare monthly newsletter", description: "Write and schedule the monthly newsletter", dueDate: twoDaysFromNow, priority: "MEDIUM", status: "PENDING", category: "work", color: "#3b82f6" },
    { title: "Fix responsive layout on blog page", description: "The blog post cards don't stack correctly on mobile", dueDate: new Date(today.getTime() + 5 * 3600000), priority: "HIGH", status: "IN_PROGRESS", progress: 30, category: "work", color: "#ef4444" },
    { title: "Research new CSS features", description: "Look into container queries and cascade layers for upcoming project", dueDate: nextMonth, priority: "LOW", status: "PENDING", category: "learning", color: "#8b5cf6" },
    { title: "Plan team offsite agenda", description: "Coordinate agenda items with the team", dueDate: nextWeek, priority: "MEDIUM", status: "PENDING", category: "work", color: "#10b981" },
    { title: "Complete API documentation", description: "Finish documenting the REST API endpoints", dueDate: threeDaysAgo, priority: "HIGH", status: "COMPLETED", progress: 100, category: "work", color: "#10b981" },
    { title: "Schedule dentist appointment", description: "Check with Dr. Smith's office for availability", dueDate: lastWeek, priority: "LOW", status: "PENDING", category: "personal", color: "#6b7280" },
  ];

  let taskCount = 0;
  for (const task of taskData) {
    const existing = await prisma.calendarTask.findFirst({
      where: { title: task.title },
    });
    if (existing) continue;

    const created = await prisma.calendarTask.create({ data: task });

    // Create calendar event for tasks with due dates
    if (task.dueDate) {
      await prisma.calendarEvent.create({
        data: {
          title: `Task: ${task.title}`,
          description: task.description,
          startDate: task.dueDate,
          allDay: true,
          eventType: "TASK",
          status: "SCHEDULED",
          color: task.color || "#8b5cf6",
          taskId: created.id,
        },
      });
    }

    taskCount++;
  }
  console.log(`  ✓ ${taskCount} calendar tasks created`);

  // ─── Calendar Events (standalone) ─────────────────────────────────────────
  const standaloneEvents = [
    {
      title: "Team Standup", description: "Daily team standup meeting",
      startDate: new Date(today.getTime() + 9 * 3600000), // today 9am
      endDate: new Date(today.getTime() + 9.5 * 3600000),  // today 9:30am
      color: "#3b82f6", eventType: "MEETING", status: "SCHEDULED", location: "Virtual - Zoom",
    },
    {
      title: "Lunch with Client", description: "Working lunch with prospective client",
      startDate: new Date(today.getTime() + 12 * 3600000), // today 12pm
      endDate: new Date(today.getTime() + 13.5 * 3600000), // today 1:30pm
      color: "#10b981", eventType: "MEETING", status: "SCHEDULED", location: "Cafe Misto",
    },
    {
      title: "Project Deadline: E-Commerce Launch", description: "Final deployment deadline",
      startDate: twoDaysFromNow,
      allDay: true,
      color: "#ef4444", eventType: "PROJECT_DEADLINE", status: "SCHEDULED",
    },
  ];

  let eventCount = 0;
  for (const evt of standaloneEvents) {
    await prisma.calendarEvent.create({ data: evt });
    eventCount++;
  }
  console.log(`  ✓ ${eventCount} calendar events created`);

  const fourDaysFromNow = new Date(today);
  fourDaysFromNow.setDate(fourDaysFromNow.getDate() + 4);

  // ─── Reminders (EMAIL type) ───────────────────────────────────────────────
  const reminderData = [
    {
      title: "Follow up with Acme Corp proposal",
      description: "Send the follow-up email about the proposal status",
      remindAt: new Date(today.getTime() + 2 * 3600000), // 2 hours from now
      remindType: "EMAIL",
      status: "PENDING",
      relatedType: "FOLLOW_UP",
    },
    {
      title: "Prepare for client presentation",
      description: "Review slides and gather demo materials",
      remindAt: new Date(today.getTime() + 8 * 3600000), // 8 hours from now
      remindType: "EMAIL",
      status: "PENDING",
      relatedType: "MEETING",
    },
    {
      title: "Weekly team report",
      description: "Submit the weekly progress report",
      remindAt: new Date(today.getTime() - 24 * 3600000), // yesterday (already past)
      remindType: "EMAIL",
      status: "PENDING",
      relatedType: "DEADLINE",
    },
    {
      title: "Invoice review",
      description: "Review and approve pending invoices",
      remindAt: fourDaysFromNow,
      remindType: "BOTH",
      status: "PENDING",
      relatedType: "TASK",
    },
  ];

  let reminderCount = 0;
  for (const rem of reminderData) {
    const existing = await prisma.reminder.findFirst({
      where: { title: rem.title },
    });
    if (existing) continue;
    await prisma.reminder.create({ data: rem });
    reminderCount++;
  }
  console.log(`  ✓ ${reminderCount} reminders created`);

  console.log("  ✓ Calendar seeding complete");
}

// Only run main() when executed directly (not when imported by other scripts)
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("Seed failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
