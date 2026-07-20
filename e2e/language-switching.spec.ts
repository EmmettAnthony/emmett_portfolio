import { test, expect, type Page } from "@playwright/test";

/**
 * Switch language by setting the cookie and reloading the page.
 * This is what the LanguageSwitcher UI does internally (document.cookie + router.refresh()),
 * just more reliable for testing since it uses a full page reload.
 */
async function setLanguage(page: Page, locale: string) {
  await page.context().addCookies([
    { name: "NEXT_LOCALE", value: locale, path: "/", domain: "localhost" },
  ]);
  // Reload current page so the server picks up the new cookie
  await page.reload();
  await page.waitForLoadState("load");
}

// ─────────────────────────────────────────────────────────────────────────
// Language Switching E2E Tests
// ─────────────────────────────────────────────────────────────────────────

test.describe("Language Switching", () => {
  test.beforeEach(async ({ page }) => {
    // Always start from English
    await setLanguage(page, "en");
    await page.goto("/");
    await page.waitForLoadState("load");
  });

  // ─── HOMEPAGE CONTENT ────────────────────────────────────────────────────

  test("homepage hero text changes between English and French", async ({ page }) => {
    // English
    await expect(page.getByText("Hello, I'm Emmett Anthony").first()).toBeVisible();
    await expect(page.getByText("Available for work").first()).toBeVisible();
    await expect(page.getByText("Skills & Expertise").first()).toBeVisible();

    // Switch to French via cookie + reload
    await setLanguage(page, "fr");
    await expect(page.getByText("Bonjour, je suis Emmett Anthony").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Disponible pour mission").first()).toBeVisible();
    await expect(page.getByText("Compétences & Expertise").first()).toBeVisible();

    // Back to English
    await setLanguage(page, "en");
    await expect(page.getByText("Hello, I'm Emmett Anthony").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Full Stack Developer").first()).toBeVisible();
    await expect(page.getByText("Skills & Expertise").first()).toBeVisible();
  });

  test("newsletter section translates on services page", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("load");
    await expect(page.getByText("Stay Updated").first()).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByText("Restez informé").first()).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "es");
    await expect(page.getByText("Manténgase al día").first()).toBeVisible({ timeout: 10000 });
  });

  // ─── ABOUT PAGE ──────────────────────────────────────────────────────────

  test("about page section headers translate", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("load");

    await expect(page.getByText("Career Journey").first()).toBeVisible();
    await expect(page.getByText("Education & Certifications").first()).toBeVisible();
    await expect(page.getByText("Technologies I Use").first()).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByText("Parcours professionnel").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Formation & Certifications").first()).toBeVisible();
    await expect(page.getByText("Technologies que j'utilise").first()).toBeVisible();

    await setLanguage(page, "es");
    await expect(page.getByText("Trayectoria profesional").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Educación y certificaciones").first()).toBeVisible();
    await expect(page.getByText("Tecnologías que uso").first()).toBeVisible();
  });

  test("resume page professional summary translates", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForLoadState("load");

    await expect(page.getByText("Professional Summary").first()).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByText("Résumé professionnel").first()).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "pt");
    await expect(page.getByText("Resumo profissional").first()).toBeVisible({ timeout: 10000 });
  });

  // ─── CONTACT PAGE ────────────────────────────────────────────────────────

  test("contact page form labels translate", async ({ page }) => {
    await page.goto("/contact");
    await page.waitForLoadState("load");

    await expect(page.getByText("Email Address").first()).toBeVisible();
    await expect(page.getByText("Full Name").first()).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByText("Adresse e-mail").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Nom complet").first()).toBeVisible();

    await setLanguage(page, "pt");
    await expect(page.getByText("Endereço de e-mail").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Nome completo").first()).toBeVisible();
  });

  // ─── BOOKING PAGE ────────────────────────────────────────────────────────

  test("booking page translates to French and Spanish", async ({ page }) => {
    await page.goto("/book");
    await page.waitForLoadState("load");

    await expect(
      page.getByRole("heading", { level: 1, name: "Book a Call", exact: true }).first()
    ).toBeVisible();

    await setLanguage(page, "fr");
    await expect(
      page.getByRole("heading", { level: 1, name: "Réserver un appel", exact: true }).first()
    ).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "es");
    await expect(
      page.getByRole("heading", { level: 1, name: "Reservar una llamada", exact: true }).first()
    ).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "en");
    await expect(
      page.getByRole("heading", { level: 1, name: "Book a Call", exact: true }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // ─── SERVICES PAGE ───────────────────────────────────────────────────────

  test("services page translates", async ({ page }) => {
    await page.goto("/services");
    await page.waitForLoadState("load");

    await expect(page.getByText("Professional services tailored to your needs").first()).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByText("Services professionnels adaptés à vos besoins").first()).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "es");
    await expect(page.getByText("Servicios profesionales adaptados a sus necesidades").first()).toBeVisible({ timeout: 10000 });
  });

  // ─── PORTFOLIO PAGE ──────────────────────────────────────────────────────

  test("portfolio page search placeholder translates", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("load");

    await expect(page.getByPlaceholder("Search projects...")).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByPlaceholder("Rechercher des projets...")).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "es");
    await expect(page.getByPlaceholder("Buscar proyectos...")).toBeVisible({ timeout: 10000 });
  });

  // ─── BLOG PAGE ───────────────────────────────────────────────────────────

  test("blog page search placeholder translates", async ({ page }) => {
    await page.goto("/blog");
    await page.waitForLoadState("load");

    await expect(page.getByPlaceholder("Search articles...")).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByPlaceholder("Rechercher des articles...")).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "it");
    await expect(page.getByPlaceholder("Cerca articoli...")).toBeVisible({ timeout: 10000 });
  });

  // ─── NAVIGATION ──────────────────────────────────────────────────────────

  test("navigation labels translate", async ({ page }) => {
    // Already on "/" from beforeEach
    await expect(page.getByRole("link", { name: "Home" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "About" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Services" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByRole("link", { name: "Accueil" }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: "À propos" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Services" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible();

    await setLanguage(page, "es");
    await expect(page.getByRole("link", { name: "Inicio" }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: "Sobre mí" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Servicios" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Blog" }).first()).toBeVisible();
  });

  test("footer content translates", async ({ page }) => {
    await expect(page.getByText("Quick Links").first()).toBeVisible();
    await expect(page.getByText("All rights reserved.")).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByText("Liens rapides").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Tous droits réservés.")).toBeVisible();

    await setLanguage(page, "es");
    await expect(page.getByText("Enlaces rápidos").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Todos los derechos reservados.")).toBeVisible();
  });

  // ─── UI DROPDOWN INTERACTION ─────────────────────────────────────────────

  test("language switcher UI dropdown changes locale correctly", async ({ page }) => {
    // Open the language switcher and switch to French via the dropdown
    await page.locator('[data-testid="language-switcher-trigger"]').first().click();
    await page
      .locator('[data-testid="language-switcher-dropdown"]')
      .first()
      .locator("button")
      .filter({ hasText: "Français" })
      .click();

    // Wait for the page to re-render with the new locale
    await expect(page.getByText("Bonjour, je suis Emmett Anthony").first()).toBeVisible({ timeout: 15000 });

    // Verify the language switcher itself updated
    await expect(page.locator('[data-testid="language-switcher-trigger"]').first())
      .toHaveAttribute("aria-label", "Changer de langue");

    // Switch back to English via the dropdown
    await page.locator('[data-testid="language-switcher-trigger"]').first().click();
    await page
      .locator('[data-testid="language-switcher-dropdown"]')
      .first()
      .locator("button")
      .filter({ hasText: "English" })
      .click();

    await expect(page.getByText("Hello, I'm Emmett Anthony").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[data-testid="language-switcher-trigger"]').first())
      .toHaveAttribute("aria-label", "Switch language");
  });

  // ─── MULTIPLE LANGUAGES ──────────────────────────────────────────────────

  test("switches through multiple languages on homepage", async ({ page }) => {
    await expect(page.getByText("Hello, I'm Emmett Anthony").first()).toBeVisible();

    await setLanguage(page, "fr");
    await expect(page.getByText("Bonjour, je suis Emmett Anthony").first()).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "de");
    await expect(page.getByText("Hallo, ich bin Emmett Anthony").first()).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "it");
    await expect(page.getByText("Ciao, sono Emmett Anthony").first()).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "es");
    await expect(page.getByText("Hola, soy Emmett Anthony").first()).toBeVisible({ timeout: 10000 });

    await setLanguage(page, "en");
    await expect(page.getByText("Hello, I'm Emmett Anthony").first()).toBeVisible({ timeout: 10000 });
  });
});
