import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactMethods } from "../ContactMethods";

// Mock i18n
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "contact.otherWaysToConnect": "Other Ways to Connect",
      "contact.chooseChannel": "Choose your channel",
      "contact.methods.email.title": "Email",
      "contact.methods.email.description": "Send me an email",
      "contact.methods.email.action": "Send Email",
      "contact.methods.whatsapp.title": "WhatsApp",
      "contact.methods.whatsapp.description": "Chat on WhatsApp",
      "contact.methods.whatsapp.action": "Send Message",
      "contact.methods.linkedin.title": "LinkedIn",
      "contact.methods.linkedin.description": "Connect professionally",
      "contact.methods.linkedin.action": "Visit Profile",
      "contact.methods.github.title": "GitHub",
      "contact.methods.github.description": "View my code",
      "contact.methods.github.action": "View GitHub",
      "contact.methods.meeting.title": "Book a Meeting",
      "contact.methods.meeting.description": "Schedule a call",
      "contact.methods.meeting.action": "Book Now",
    };
    return translations[key] || key;
  },
}));

// Mock SiteSettingsProvider
vi.mock("@/components/settings/SiteSettingsProvider", () => ({
  useSiteSettings: () => ({
    email: "hello@emmettanthony.dev",
    phone: "+231775623283",
    social: {
      linkedin: "https://linkedin.com/in/emmettanthony",
      github: "https://github.com/emmettanthony",
    },
  }),
}));

// Mock framer-motion
vi.mock("framer-motion")
;

// Mock AnimateOnScroll
vi.mock("@/components/shared/AnimateOnScroll", () => ({
  AnimateOnScroll: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("ContactMethods", () => {
  it("renders section title", () => {
    render(<ContactMethods />);
    expect(screen.getByText("Other Ways to Connect")).toBeInTheDocument();
  });

  it("renders section description", () => {
    render(<ContactMethods />);
    expect(screen.getByText("Choose your channel")).toBeInTheDocument();
  });

  it("renders all five contact method cards", () => {
    render(<ContactMethods />);
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Book a Meeting")).toBeInTheDocument();
  });

  it("renders descriptions for each method", () => {
    render(<ContactMethods />);
    expect(screen.getByText("Send me an email")).toBeInTheDocument();
    expect(screen.getByText("Chat on WhatsApp")).toBeInTheDocument();
    expect(screen.getByText("Connect professionally")).toBeInTheDocument();
    expect(screen.getByText("View my code")).toBeInTheDocument();
    expect(screen.getByText("Schedule a call")).toBeInTheDocument();
  });

  it("renders email link with mailto href", () => {
    render(<ContactMethods />);
    const emailSection = screen.getByText("Email").closest("a");
    expect(emailSection).toHaveAttribute("href", "mailto:hello@emmettanthony.dev?subject=Project%20Inquiry");
  });

  it("renders WhatsApp link with phone number", () => {
    render(<ContactMethods />);
    const whatsappSection = screen.getByText("WhatsApp").closest("a");
    expect(whatsappSection?.getAttribute("href")).toContain("https://wa.me/+231775623283");
  });

  it("renders LinkedIn link", () => {
    render(<ContactMethods />);
    const linkedinSection = screen.getByText("LinkedIn").closest("a");
    expect(linkedinSection).toHaveAttribute("href", "https://linkedin.com/in/emmettanthony");
  });

  it("renders GitHub link", () => {
    render(<ContactMethods />);
    const githubSection = screen.getByText("GitHub").closest("a");
    expect(githubSection).toHaveAttribute("href", "https://github.com/emmettanthony");
  });

  it("opens external links in new tab", () => {
    render(<ContactMethods />);
    const links = screen.getAllByRole("link");
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (href?.startsWith("http")) {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      }
    });
  });

  it("renders action labels for each method", () => {
    render(<ContactMethods />);
    expect(screen.getByText("Send Email")).toBeInTheDocument();
    expect(screen.getByText("Send Message")).toBeInTheDocument();
    expect(screen.getByText("Visit Profile")).toBeInTheDocument();
    expect(screen.getByText("View GitHub")).toBeInTheDocument();
    expect(screen.getByText("Book Now")).toBeInTheDocument();
  });
});
