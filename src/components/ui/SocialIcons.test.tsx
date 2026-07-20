import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { GithubIcon, LinkedInIcon, TwitterIcon } from "./SocialIcons";

describe("SocialIcons", () => {
  describe("GithubIcon", () => {
    it("renders an SVG element", () => {
      const { container } = render(<GithubIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });

    it("applies className to SVG", () => {
      const { container } = render(<GithubIcon className="h-6 w-6" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-6");
      expect(svg?.getAttribute("class")).toContain("w-6");
    });

    it("has default size class", () => {
      const { container } = render(<GithubIcon />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-4");
      expect(svg?.getAttribute("class")).toContain("w-4");
    });
  });

  describe("LinkedInIcon", () => {
    it("renders an SVG element", () => {
      const { container } = render(<LinkedInIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });

    it("applies className", () => {
      const { container } = render(<LinkedInIcon className="h-8 w-8" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("h-8");
    });
  });

  describe("TwitterIcon", () => {
    it("renders an SVG element", () => {
      const { container } = render(<TwitterIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });

    it("applies className", () => {
      const { container } = render(<TwitterIcon className="text-blue-500" />);
      const svg = container.querySelector("svg");
      expect(svg?.getAttribute("class")).toContain("text-blue-500");
    });
  });
});
