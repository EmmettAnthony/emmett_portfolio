import { test, expect } from "@playwright/test";

const MOCK_PROJECTS = [
  {
    id: "p1",
    title: "ShopFlow E-Commerce Platform",
    slug: "shopflow",
    shortDescription: "A full-featured e-commerce platform with real-time inventory management and payment processing.",
    fullDescription: "Full description for ShopFlow.",
    category: { id: "cat-1", name: "Web Development", slug: "web-dev" },
    technologies: [
      { id: "t1", name: "Next.js", slug: "nextjs" },
      { id: "t2", name: "TypeScript", slug: "typescript" },
      { id: "t3", name: "Stripe", slug: "stripe" },
    ],
    featured: true,
    featuredImage: "/images/shopflow.jpg",
    tags: ["ecommerce", "nextjs", "stripe"],
    completionDate: "2026-03-15",
    createdAt: "2026-02-01T00:00:00Z",
    viewCount: 1250,
  },
  {
    id: "p2",
    title: "TaskPro Project Management",
    slug: "taskpro",
    shortDescription: "A collaborative project management tool with real-time updates and team workflows.",
    fullDescription: "Full description for TaskPro.",
    category: { id: "cat-1", name: "Web Development", slug: "web-dev" },
    technologies: [
      { id: "t4", name: "React", slug: "react" },
      { id: "t5", name: "Node.js", slug: "nodejs" },
      { id: "t6", name: "PostgreSQL", slug: "postgresql" },
    ],
    featured: true,
    featuredImage: "/images/taskpro.jpg",
    tags: ["project-management", "react", "node"],
    completionDate: "2026-05-20",
    createdAt: "2026-04-01T00:00:00Z",
    viewCount: 890,
  },
  {
    id: "p3",
    title: "ContentCMS",
    slug: "contentcms",
    shortDescription: "A headless CMS platform built for content teams with powerful editing tools.",
    fullDescription: "Full description for ContentCMS.",
    category: { id: "cat-2", name: "Business Applications", slug: "business" },
    technologies: [
      { id: "t1", name: "Next.js", slug: "nextjs" },
      { id: "t2", name: "TypeScript", slug: "typescript" },
      { id: "t6", name: "PostgreSQL", slug: "postgresql" },
    ],
    featured: false,
    thumbnailImage: "/images/contentcms.jpg",
    tags: ["cms", "nextjs", "typescript"],
    completionDate: "2026-01-10",
    createdAt: "2025-12-01T00:00:00Z",
    viewCount: 540,
  },
  {
    id: "p4",
    title: "DataViz Dashboard",
    slug: "dataviz",
    shortDescription: "An interactive data visualization dashboard for analytics teams.",
    fullDescription: "Full description for DataViz.",
    category: { id: "cat-3", name: "Data Analytics", slug: "analytics" },
    technologies: [
      { id: "t7", name: "D3.js", slug: "d3js" },
      { id: "t8", name: "Python", slug: "python" },
      { id: "t2", name: "TypeScript", slug: "typescript" },
    ],
    featured: false,
    thumbnailImage: "/images/dataviz.jpg",
    tags: ["analytics", "d3", "python"],
    completionDate: "2026-04-05",
    createdAt: "2026-03-01T00:00:00Z",
    viewCount: 2100,
  },
];

// Helper: scope project grid titles to only the "All Projects" section
function gridProject(page: import("@playwright/test").Page, title: string) {
  return page.locator("section[id='all-projects']").getByText(title, { exact: false });
}

test.describe("Portfolio Page Search & Filter", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the portfolio API
    await page.route("**/api/portfolio**", async (route) => {
      const url = new URL(route.request().url());
      const featured = url.searchParams.get("featured");
      if (featured === "true") {
        await route.fulfill({ json: { projects: MOCK_PROJECTS.filter((p) => p.featured) } });
      } else {
        await route.fulfill({ json: { projects: MOCK_PROJECTS } });
      }
    });

    // Mock testimonials (empty)
    await page.route("**/api/testimonials**", async (route) => {
      await route.fulfill({ json: { testimonials: [] } });
    });

    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");
  });

  // ─── Search ──────────────────────────────────────────────────────────────

  test("searching by title filters projects to matching results", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search projects...");
    await searchInput.fill("ShopFlow");

    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).toBeVisible();
    await expect(gridProject(page, "TaskPro Project Management")).not.toBeVisible();
    await expect(gridProject(page, "ContentCMS")).not.toBeVisible();
    await expect(gridProject(page, "DataViz Dashboard")).not.toBeVisible();
  });

  test("searching by description text filters projects", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search projects...");
    await searchInput.fill("e-commerce");

    // Only ShopFlow's shortDescription contains "e-commerce"
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).toBeVisible();
    await expect(gridProject(page, "TaskPro Project Management")).not.toBeVisible();
  });

  test("searching with case-insensitive matching works", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search projects...");
    await searchInput.fill("dataviz");

    await expect(gridProject(page, "DataViz Dashboard")).toBeVisible();
  });

  test("search with no results shows empty state with clear button", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search projects...");
    await searchInput.fill("xyznonexistent");

    await expect(page.getByText(/No projects found matching/)).toBeVisible();
    await expect(page.getByText("Clear all filters")).toBeVisible();
  });

  test("clear all filters button resets the project list", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search projects...");
    await searchInput.fill("xyznonexistent");

    // Empty state should show
    await expect(page.getByText(/No projects found matching/)).toBeVisible();

    // Click "Clear all filters"
    await page.getByText("Clear all filters").click();

    // All projects should be visible again
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).toBeVisible();
    await expect(gridProject(page, "TaskPro Project Management")).toBeVisible();
    await expect(gridProject(page, "ContentCMS")).toBeVisible();
    await expect(gridProject(page, "DataViz Dashboard")).toBeVisible();
    // Search input should be cleared
    await expect(searchInput).toHaveValue("");
  });

  // ─── Category Filter ─────────────────────────────────────────────────────

  test("category filter shows only matching projects", async ({ page }) => {
    await page.getByRole("button", { name: "Data Analytics", exact: true }).click();

    await expect(gridProject(page, "DataViz Dashboard")).toBeVisible();
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).not.toBeVisible();
    await expect(gridProject(page, "TaskPro Project Management")).not.toBeVisible();
    await expect(gridProject(page, "ContentCMS")).not.toBeVisible();
  });

  test("switching categories changes the filtered results", async ({ page }) => {
    // First select "Business Applications"
    await page.getByRole("button", { name: "Business Applications", exact: true }).click();
    await expect(gridProject(page, "ContentCMS")).toBeVisible();
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).not.toBeVisible();

    // Switch to "Web Development"
    await page.getByRole("button", { name: "Web Development", exact: true }).click();
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).toBeVisible();
    await expect(gridProject(page, "TaskPro Project Management")).toBeVisible();
    await expect(gridProject(page, "ContentCMS")).not.toBeVisible();
  });

  test("category filter highlights the active button", async ({ page }) => {
    const analyticsBtn = page.getByRole("button", { name: "Data Analytics", exact: true });

    // Default: "All" is active, others are not pressed
    await expect(analyticsBtn).toHaveAttribute("aria-pressed", "false");

    await analyticsBtn.click();
    await expect(analyticsBtn).toHaveAttribute("aria-pressed", "true");
  });

  // ─── Technology Filter ───────────────────────────────────────────────────

  test("technology pill filter shows only matching projects", async ({ page }) => {
    // Click "React" — only TaskPro has React (OR logic)
    await page.getByRole("button", { name: "React", exact: true }).click();

    await expect(gridProject(page, "TaskPro Project Management")).toBeVisible();
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).not.toBeVisible();
    await expect(gridProject(page, "ContentCMS")).not.toBeVisible();
    await expect(gridProject(page, "DataViz Dashboard")).not.toBeVisible();
  });

  test("selecting Next.js tech shows all projects using Next.js", async ({ page }) => {
    await page.getByRole("button", { name: "Next.js", exact: true }).click();

    // The app uses OR logic (some()): show projects that have ANY selected tech
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).toBeVisible();
    await expect(gridProject(page, "ContentCMS")).toBeVisible();
    await expect(gridProject(page, "TaskPro Project Management")).not.toBeVisible();
    await expect(gridProject(page, "DataViz Dashboard")).not.toBeVisible();
  });

  test("multiple technology pills use OR logic (any matching tech shows project)", async ({ page }) => {
    // Select "Stripe" AND "Python" — Stripe matches ShopFlow, Python matches DataViz
    await page.getByRole("button", { name: "Stripe", exact: true }).click();
    await page.getByRole("button", { name: "Python", exact: true }).click();

    // ShopFlow has Stripe, DataViz has Python — both match the OR filter
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).toBeVisible();
    await expect(gridProject(page, "DataViz Dashboard")).toBeVisible();
    // TaskPro and ContentCMS have neither Stripe nor Python
    await expect(gridProject(page, "TaskPro Project Management")).not.toBeVisible();
    await expect(gridProject(page, "ContentCMS")).not.toBeVisible();
  });

  test("deselecting a technology pill removes its filter", async ({ page }) => {
    const nextBtn = page.getByRole("button", { name: "Next.js", exact: true });
    await nextBtn.click();
    // Only Next.js projects visible
    await expect(gridProject(page, "ContentCMS")).toBeVisible();
    await expect(gridProject(page, "TaskPro Project Management")).not.toBeVisible();

    // Deselect Next.js
    await nextBtn.click();
    // All projects back
    await expect(gridProject(page, "TaskPro Project Management")).toBeVisible();
    await expect(gridProject(page, "ContentCMS")).toBeVisible();
  });

  // ─── Sort ────────────────────────────────────────────────────────────────

  test("default sort is newest first", async ({ page }) => {
    const projectTitles = page.locator("section[id='all-projects'] h3");
    const titles = await projectTitles.allTextContents();

    // Mock data sorted by createdAt descending: TaskPro (Apr) > DataViz (Mar) > ShopFlow (Feb) > ContentCMS (Dec)
    expect(titles[0]).toContain("TaskPro");
    expect(titles[1]).toContain("DataViz");
    expect(titles[2]).toContain("ShopFlow");
    expect(titles[3]).toContain("ContentCMS");
  });

  test("sort by name orders projects A-Z", async ({ page }) => {
    await page.getByLabel("Sort projects").selectOption("name");

    const projectTitles = page.locator("section[id='all-projects'] h3");
    const titles = await projectTitles.allTextContents();

    expect(titles).toEqual([
      "ContentCMS",
      "DataViz Dashboard",
      "ShopFlow E-Commerce Platform",
      "TaskPro Project Management",
    ]);
  });

  // ─── Combined Filters ────────────────────────────────────────────────────

  test("combining search and category filter narrows results", async ({ page }) => {
    const searchInput = page.getByPlaceholder("Search projects...");
    await searchInput.fill("Content");

    // Only ContentCMS matches
    await expect(gridProject(page, "ContentCMS")).toBeVisible();
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).not.toBeVisible();

    // Also apply "Business Applications" category — ContentCMS still shows
    await page.getByRole("button", { name: "Business Applications", exact: true }).click();
    await expect(gridProject(page, "ContentCMS")).toBeVisible();

    // Switch category to "Web Development" — no matching project (ContentCMS is Business Apps)
    await page.getByRole("button", { name: "Web Development", exact: true }).click();
    await expect(page.getByText(/No projects found matching/)).toBeVisible();
  });

  test("applying category and tech filter together", async ({ page }) => {
    // Select "Web Development" category
    await page.getByRole("button", { name: "Web Development", exact: true }).click();
    // Select "React" tech — only TaskPro is Web Development AND has React
    await page.getByRole("button", { name: "React", exact: true }).click();

    await expect(gridProject(page, "TaskPro Project Management")).toBeVisible();
    await expect(gridProject(page, "ShopFlow E-Commerce Platform")).not.toBeVisible(); // no React
    await expect(gridProject(page, "ContentCMS")).not.toBeVisible(); // Business Apps, not Web Dev
  });
});
