import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlogCard } from "./BlogCard";

// Mock next/image
vi.mock("next/image");

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

// Mock @/lib/utils
vi.mock("@/lib/utils", () => ({
  formatDate: (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },
  readTime: (content: string) => Math.ceil(content.split(" ").length / 200),
}));

const samplePost = {
  slug: "my-blog-post",
  title: "How to Build a Next.js App",
  excerpt: "A comprehensive guide to building modern web applications with Next.js",
  image: "/images/blog/post1.jpg",
  category: "Development",
  tags: ["Next.js", "React", "TypeScript"],
  author: "Emmett Anthony",
  publishedAt: "2024-06-15",
  content: "This is the full article content with more words for reading time calculation purposes.",
  readingTime: 5,
};

describe("BlogCard", () => {
  it("renders the post title as a link", () => {
    render(<BlogCard post={samplePost} index={0} />);
    const link = screen.getByText("How to Build a Next.js App").closest("a");
    expect(link).toHaveAttribute("href", "/blog/my-blog-post");
  });

  it("renders the category badge", () => {
    render(<BlogCard post={samplePost} index={0} />);
    expect(screen.getByText("Development")).toBeInTheDocument();
  });

  it("renders the excerpt", () => {
    render(<BlogCard post={samplePost} index={0} />);
    expect(
      screen.getByText(
        "A comprehensive guide to building modern web applications with Next.js",
      ),
    ).toBeInTheDocument();
  });

  it("renders 'Read More' link", () => {
    render(<BlogCard post={samplePost} index={0} />);
    expect(screen.getByText("Read More")).toBeInTheDocument();
  });

  it("renders the formatted date", () => {
    render(<BlogCard post={samplePost} index={0} />);
    // Jun 15, 2024
    expect(screen.getByText(/Jun.*15.*2024|2024.*Jun.*15/)).toBeInTheDocument();
  });

  it("renders reading time", () => {
    render(<BlogCard post={samplePost} index={0} />);
    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("renders up to 3 tags", () => {
    render(<BlogCard post={samplePost} index={0} />);
    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("renders the post image with correct alt text", () => {
    const { container } = render(<BlogCard post={samplePost} index={0} />);
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("alt", "How to Build a Next.js App");
  });

  it("renders link wrapping the entire card", () => {
    render(<BlogCard post={samplePost} index={0} />);
    const link = screen.getByText("How to Build a Next.js App").closest("a");
    expect(link).toHaveClass("group");
  });

  it("renders Calendar icon", () => {
    const { container } = render(<BlogCard post={samplePost} index={0} />);
    const calendarIcon = container.querySelector("svg.lucide-calendar");
    expect(calendarIcon).toBeInTheDocument();
  });

  it("uses readingTime from post when provided", () => {
    render(<BlogCard post={samplePost} index={0} />);
    expect(screen.getByText("5 min read")).toBeInTheDocument();
  });

  it("calculates reading time from content when readingTime not provided", () => {
    const postWithoutReadingTime = { ...samplePost, readingTime: undefined };
    render(<BlogCard post={postWithoutReadingTime} index={0} />);
    // 12 words / 200 = 0.06, ceil = 1 min read
    expect(screen.getByText("1 min read")).toBeInTheDocument();
  });

  it("renders 0 min read when both readingTime and content are missing", () => {
    const postNoContent = {
      ...samplePost,
      readingTime: undefined,
      content: undefined,
    };
    render(<BlogCard post={postNoContent} index={0} />);
    expect(screen.getByText("0 min read")).toBeInTheDocument();
  });

  it("uses default excerpt when excerpt is empty", () => {
    const postNoExcerpt = { ...samplePost, excerpt: "" };
    render(<BlogCard post={postNoExcerpt} index={0} />);
    expect(screen.getByText("Read this article...")).toBeInTheDocument();
  });

  it("renders only up to 3 tags", () => {
    const postManyTags = {
      ...samplePost,
      tags: ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"],
    };
    const { container } = render(<BlogCard post={postManyTags} index={0} />);
    const tagSpans = container.querySelectorAll(
      ".inline-flex.rounded-md",
    );
    // Tags plus category badge = 4 rounded-md elements
    expect(tagSpans.length).toBeGreaterThanOrEqual(3);
  });

  it("renders as an article element", () => {
    const { container } = render(<BlogCard post={samplePost} index={0} />);
    expect(container.firstChild?.nodeName).toBe("ARTICLE");
  });
});
