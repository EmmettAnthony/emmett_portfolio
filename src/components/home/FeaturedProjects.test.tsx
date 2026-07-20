import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedProjects } from "./FeaturedProjects";

// Mock dependencies
vi.mock("@/lib/i18n", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      "home.projects.title": "Featured Projects",
      "home.projects.subtitle": "A selection of my work",
      "home.projects.viewAll": "View All Projects",
      "common.github": "GitHub",
      "common.liveDemo": "Live Demo",
    };
    return translations[key] || key;
  },
}));

vi.mock("framer-motion")
;

vi.mock("@/components/shared/SectionHeader", () => ({
  SectionHeader: ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div data-testid="section-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  ),
}));

// Mock next/image
vi.mock("next/image");

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>{children as React.ReactNode}</a>
  ),
}));

describe("FeaturedProjects", () => {
  it("renders section header with title", () => {
    render(<FeaturedProjects />);
    expect(screen.getByText("Featured Projects")).toBeInTheDocument();
    expect(screen.getByText("A selection of my work")).toBeInTheDocument();
  });

  it("renders featured project titles (only featured: true projects)", () => {
    render(<FeaturedProjects />);
    expect(screen.getByText("ShopFlow E-Commerce Platform")).toBeInTheDocument();
    expect(screen.getByText("TaskPro Project Management")).toBeInTheDocument();
    expect(screen.getByText("ContentCMS")).toBeInTheDocument();
  });

  it("does not render non-featured projects", () => {
    render(<FeaturedProjects />);
    expect(screen.queryByText("Emmett Portfolio")).not.toBeInTheDocument();
    expect(screen.queryByText("UrbanBites Restaurant Website")).not.toBeInTheDocument();
    expect(screen.queryByText("DataVista Analytics Dashboard")).not.toBeInTheDocument();
  });

  it("renders project descriptions", () => {
    render(<FeaturedProjects />);
    expect(screen.getByText(/full-featured e-commerce platform/)).toBeInTheDocument();
    expect(screen.getByText(/collaborative project management/)).toBeInTheDocument();
    expect(screen.getByText(/headless CMS platform/)).toBeInTheDocument();
  });

  it("renders project tags", () => {
    render(<FeaturedProjects />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
  });

  it("renders GitHub and Live Demo links for projects that have them", () => {
    render(<FeaturedProjects />);
    const githubLinks = screen.getAllByText("GitHub");
    expect(githubLinks.length).toBeGreaterThan(0);
    const liveDemoLinks = screen.getAllByText("Live Demo");
    expect(liveDemoLinks.length).toBeGreaterThan(0);
  });

  it("renders view all link", () => {
    render(<FeaturedProjects />);
    const viewAllLink = screen.getByText("View All Projects").closest("a");
    expect(viewAllLink).toHaveAttribute("href", "/portfolio");
  });

  it("renders project images", () => {
    render(<FeaturedProjects />);
    const images = screen.getAllByTestId("next-image");
    expect(images.length).toBeGreaterThan(0);
  });

  it("renders correct number of featured projects (3)", () => {
    const { container } = render(<FeaturedProjects />);
    const articles = container.querySelectorAll("article");
    expect(articles.length).toBe(3);
  });
});
