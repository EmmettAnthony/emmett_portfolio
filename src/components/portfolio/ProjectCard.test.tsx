import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "./ProjectCard";

// Mock next/image
vi.mock("next/image", () => ({
  default: ({ alt, priority, fill, ...props }: Record<string, unknown>) => (
    <img
      alt={alt as string}
      data-priority={priority ? "true" : "false"}
      {...props}
    />
  ),
}));

// Mock framer-motion
vi.mock("framer-motion")
;

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock SocialIcons
vi.mock("@/components/ui/SocialIcons", () => ({
  GithubIcon: () => <svg data-testid="github-icon" />,
}));

const sampleProject = {
  id: "project-1",
  title: "E-commerce Platform",
  description: "A full-stack e-commerce platform built with Next.js and Stripe",
  image: "/images/projects/ecommerce.jpg",
  category: "Full Stack",
  tags: ["Next.js", "TypeScript", "Stripe"],
  githubUrl: "https://github.com/user/ecommerce",
  liveUrl: "https://ecommerce-demo.com",
  year: 2024,
};

describe("ProjectCard", () => {
  it("renders the project title", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    expect(screen.getByText("E-commerce Platform")).toBeInTheDocument();
  });

  it("renders the project description", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    expect(
      screen.getByText(
        "A full-stack e-commerce platform built with Next.js and Stripe",
      ),
    ).toBeInTheDocument();
  });

  it("renders the category", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    expect(screen.getByText("Full Stack")).toBeInTheDocument();
  });

  it("renders the year", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  it("renders all tags", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Stripe")).toBeInTheDocument();
  });

  it("renders the project image with alt text", () => {
    const { container } = render(
      <ProjectCard project={sampleProject} index={0} />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "E-commerce Platform");
  });

  it("renders GitHub link when githubUrl is provided", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    const githubLink = screen.getByText("GitHub");
    expect(githubLink).toBeInTheDocument();
    expect(githubLink.closest("a")).toHaveAttribute(
      "href",
      "https://github.com/user/ecommerce",
    );
  });

  it("renders Live Demo link when liveUrl is provided", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    const liveLink = screen.getByText("Live Demo");
    expect(liveLink).toBeInTheDocument();
    expect(liveLink.closest("a")).toHaveAttribute(
      "href",
      "https://ecommerce-demo.com",
    );
  });

  it("opens GitHub link in new tab", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    const githubLink = screen.getByText("GitHub").closest("a");
    expect(githubLink).toHaveAttribute("target", "_blank");
  });

  it("opens Live Demo link in new tab", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    const liveLink = screen.getByText("Live Demo").closest("a");
    expect(liveLink).toHaveAttribute("target", "_blank");
  });

  it("does not render GitHub link when githubUrl is null", () => {
    const projectNoGitHub = { ...sampleProject, githubUrl: null };
    render(<ProjectCard project={projectNoGitHub} index={0} />);
    expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
  });

  it("does not render Live Demo link when liveUrl is null", () => {
    const projectNoLive = { ...sampleProject, liveUrl: null };
    render(<ProjectCard project={projectNoLive} index={0} />);
    expect(screen.queryByText("Live Demo")).not.toBeInTheDocument();
  });

  it("renders GitHub icon next to GitHub link", () => {
    render(<ProjectCard project={sampleProject} index={0} />);
    expect(screen.getByTestId("github-icon")).toBeInTheDocument();
  });

  it("sets priority on image when priority prop is true", () => {
    const { container } = render(
      <ProjectCard project={sampleProject} index={0} priority />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("data-priority", "true");
  });

  it("does not set priority by default", () => {
    const { container } = render(
      <ProjectCard project={sampleProject} index={0} />,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("data-priority", "false");
  });

  it("renders as an article element", () => {
    const { container } = render(
      <ProjectCard project={sampleProject} index={0} />,
    );
    expect(container.firstChild?.nodeName).toBe("ARTICLE");
  });

  it("renders no overlay links when both githubUrl and liveUrl are null", () => {
    const projectNoLinks = {
      ...sampleProject,
      githubUrl: null,
      liveUrl: null,
    };
    const { container } = render(
      <ProjectCard project={projectNoLinks} index={0} />,
    );
    // Use getAttribute to check for the hover overlay class
    const imgContainer = container.querySelector(".overflow-hidden");
    const links = imgContainer?.querySelectorAll("a");
    expect(links?.length || 0).toBe(0);
  });
});
