/**
 * ────────────────────────────────────────────────────────────
 * EMMETT ANTHONY — Enterprise Design System
 * ────────────────────────────────────────────────────────────
 *
 * Brand:        Emmett Anthony | Professional Software Developer
 * Design DNA:   Premium · Modern · Trustworthy · Minimal
 * Inspirations: Vercel (craft), Linear (clarity), Stripe (polish),
 *               GitHub (utility), Notion (simplicity), Apple (precision)
 *
 * This is the single source of truth for all design tokens.
 * Changes should be propagated to:
 *   - src/app/globals.css  → CSS custom properties (runtime)
 *   - components.json       → shadcn/ui theme config
 */

// =============================================================================
// 1. BRAND COLORS
// =============================================================================
//
// The primary brand "Aether Indigo" is a bespoke hue — sits between
// traditional blue and purple, communicating innovation + trust.
// Not a direct copy of any company's palette.

export const brand = {
  /** Primary — Aether Indigo: deep, trustworthy, premium */
  primary: {
    50:  "#eef2ff",  // hsl(238 100% 97%)   — lightest tint
    100: "#e0e7ff",  // hsl(238 100% 94%)
    200: "#c7d2fe",  // hsl(237 97%  89%)
    300: "#a5b4fc",  // hsl(236 95%  82%)
    400: "#818cf8",  // hsl(235 88%  74%)
    500: "#6366f1",  // hsl(234 84%  67%)   — anchor
    600: "#4f46e5",  // hsl(243 75%  59%)   — PRIMARY (buttons, links)
    700: "#4338ca",  // hsl(244 56%  51%)   — hover state
    800: "#3730a3",  // hsl(244 52%  41%)   — active state
    900: "#312e81",  // hsl(245 47%  34%)   — dark variant
    950: "#1e1b4b",  // hsl(244 47%  20%)   — darkest
  },

  /** Secondary — Violet, used in gradients and decorative accents */
  secondary: {
    50:  "#f5f3ff",
    100: "#ede9fe",
    200: "#ddd6fe",
    300: "#c4b5fd",
    400: "#a78bfa",
    500: "#8b5cf6",
    600: "#7c3aed",
    700: "#6d28d9",
    800: "#5b21b6",
    900: "#4c1d95",
    950: "#2e1065",
  },

  /** Accent — Teal, for positive info and highlights */
  accent: {
    50:  "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
} as const;

// =============================================================================
// 2. NEUTRAL PALETTE — Warm Zinc (Linear-inspired warmth)
// =============================================================================

export const neutral = {
  50:  "#fafafa",
  100: "#f4f4f5",
  200: "#e4e4e7",
  300: "#d4d4d8",
  400: "#a1a1aa",
  500: "#71717a",
  600: "#52525b",
  700: "#3f3f46",
  800: "#27272a",
  900: "#18181b",
  950: "#09090b",
} as const;

// =============================================================================
// 3. SEMANTIC COLOR TOKENS
// =============================================================================

export const semantic = {
  success: {
    main:    "#10b981",  // emerald-500
    hover:   "#059669",  // emerald-600
    light:   "#d1fae5",  // emerald-100
    dark:    "#065f46",  // emerald-800
    bg:      "#ecfdf5",  // emerald-50
    border:  "#a7f3d0",  // emerald-200
    text:    "#065f46",  // emerald-800
  },
  warning: {
    main:    "#f59e0b",  // amber-500
    hover:   "#d97706",  // amber-600
    light:   "#fef3c7",  // amber-100
    dark:    "#92400e",  // amber-800
    bg:      "#fffbeb",  // amber-50
    border:  "#fde68a",  // amber-200
    text:    "#92400e",  // amber-800
  },
  error: {
    main:    "#ef4444",  // red-500
    hover:   "#dc2626",  // red-600
    light:   "#fee2e2",  // red-100
    dark:    "#991b1b",  // red-800
    bg:      "#fef2f2",  // red-50
    border:  "#fecaca",  // red-200
    text:    "#991b1b",  // red-800
  },
  info: {
    main:    "#6366f1",  // indigo-500 (ties back to brand)
    hover:   "#4f46e5",  // indigo-600
    light:   "#e0e7ff",  // indigo-100
    dark:    "#3730a3",  // indigo-800
    bg:      "#eef2ff",  // indigo-50
    border:  "#c7d2fe",  // indigo-200
    text:    "#3730a3",  // indigo-800
  },
} as const;

// =============================================================================
// 4. TYPOGRAPHY
// =============================================================================

export const typography = {
  /** Font families */
  font: {
    sans: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Geist Mono', 'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
    heading: "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  /** Font sizes (px / rem) */
  size: {
    caption:    "0.75rem",   // 12px
    small:      "0.8125rem", // 13px
    body:       "0.875rem",  // 14px
    bodyLarge:  "1rem",      // 16px
    h6:         "1rem",      // 16px
    h5:         "1.125rem",  // 18px
    h4:         "1.25rem",   // 20px
    h3:         "1.5rem",    // 24px
    h2:         "1.875rem",  // 30px
    h1:         "2.25rem",   // 36px
    display:    "3.75rem",   // 60px
  },

  /** Font weights */
  weight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
  },

  /** Line heights */
  leading: {
    tight:   1.15,
    normal:  1.5,
    relaxed: 1.75,
  },

  /** Letter spacing */
  tracking: {
    tight:   "-0.025em",
    normal:  "0em",
    wide:    "0.025em",
    wider:   "0.05em",
    widest:  "0.1em",
  },
} as const;

// =============================================================================
// 5. SPACING SYSTEM — 4px base unit (following Tailwind convention)
// =============================================================================

export const spacing = {
  0:  "0px",
  1:  "0.25rem",   // 4px
  2:  "0.5rem",    // 8px
  3:  "0.75rem",   // 12px
  4:  "1rem",      // 16px
  5:  "1.25rem",   // 20px
  6:  "1.5rem",    // 24px
  8:  "2rem",      // 32px
  10: "2.5rem",    // 40px
  12: "3rem",      // 48px
  16: "4rem",      // 64px
  20: "5rem",      // 80px
  24: "6rem",      // 96px
  28: "7rem",      // 112px
  32: "8rem",      // 128px
} as const;

// =============================================================================
// 6. BORDER RADIUS
// =============================================================================

export const radius = {
  none:    "0px",
  xs:      "0.25rem",   // 4px  — tags, small badges
  sm:      "0.375rem",  // 6px  — inputs, buttons
  md:      "0.5rem",    // 8px  — cards, modals
  lg:      "0.75rem",   // 12px — larger cards, dialogs
  xl:      "1rem",      // 16px — hero sections, feature cards
  "2xl":   "1.25rem",   // 20px — large containers
  "3xl":   "1.5rem",    // 24px — CTAs, special sections
  full:    "9999px",    // pill shape
} as const;

// =============================================================================
// 7. SHADOW SYSTEM
// =============================================================================

export const shadows = {
  xs:    "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  sm:    "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
  md:    "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  lg:    "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  xl:    "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  card:  "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
  dropdown: "0 10px 15px -3px rgb(0 0 0 / 0.15), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  modal: "0 25px 50px -12px rgb(0 0 0 / 0.4)",
  glow:  "0 0 20px rgb(99 102 241 / 0.15)",
} as const;

// =============================================================================
// 8. BREAKPOINTS
// =============================================================================

export const breakpoints = {
  mobile:  "375px",
  tablet:  "768px",
  laptop:  "1024px",
  desktop: "1280px",
  wide:    "1536px",
} as const;

// =============================================================================
// 9. ANIMATION TOKENS
// =============================================================================

export const animation = {
  duration: {
    instant:  "100ms",
    fast:     "150ms",
    normal:   "200ms",
    slow:     "300ms",
    slower:   "500ms",
  },
  easing: {
    default:  "cubic-bezier(0.4, 0, 0.2, 1)",
    linear:   "linear",
    in:       "cubic-bezier(0.4, 0, 1, 1)",
    out:      "cubic-bezier(0, 0, 0.2, 1)",
    spring:   "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// =============================================================================
// 10. GRADIENT DEFINITIONS
// =============================================================================

export const gradients = {
  /** Hero/header backgrounds */
  hero: {
    blue:           "from-blue-500/5 via-transparent to-transparent",
    purple:         "from-purple-500/5 via-transparent to-transparent",
    bluePurple:     "from-blue-500/5 via-transparent to-transparent",
    indigo:         "from-indigo-500/5 via-transparent to-transparent",
    teal:           "from-teal-500/5 via-transparent to-transparent",
    amber:          "from-amber-500/5 via-transparent to-transparent",
  },

  /**
   * CSS variable references for runtime use.
   * Actual values are defined in globals.css via OKLCH for precision.
   */
  button: {
    primary:        "var(--gradient-primary)",
    primaryHover:   "var(--gradient-primary-hover)",
    accent:         "var(--gradient-primary)", // indigo→violet via OKLCH
    success:        "linear-gradient(135deg, #10b981, #059669)",
    danger:         "linear-gradient(135deg, #ef4444, #dc2626)",
  },

  /** CTA section backgrounds */
  cta: {
    default:        "var(--gradient-cta)",
    branded:        "linear-gradient(135deg, #4f46e5, #6d28d9)",
  },

  /** Text gradients for headings */
  text: {
    brand:          "var(--gradient-text-brand)",
    accent:         "var(--gradient-text-accent)",
    warm:           "linear-gradient(135deg, #fbbf24, #f97316)",
    cool:           "linear-gradient(135deg, #14b8a6, #06b6d4)",
  },
} as const;

// =============================================================================
// 10b. CSS CUSTOM PROPERTIES REFERENCE
// =============================================================================
//
// All design tokens are implemented as CSS custom properties in globals.css.
// Utility classes via Tailwind v4 @theme inline:
//
//   bg-brand-500, text-brand-700, border-brand-200
//   bg-primary-hover, bg-surface, bg-surface-elevated
//   text-success, text-warning, text-error, text-info
//   bg-badge-success-bg, text-badge-success-text
//
// Shadow CSS variables (consumed via var() or custom Tailwind utilities):
//   var(--shadow-sm), var(--shadow-md), var(--shadow-glow), etc.
//
// Gradient CSS variables (consumed via background-image: var(--gradient-*)):
//   var(--gradient-primary), var(--gradient-text-brand), etc.

// =============================================================================
// 11. COMPONENT-SPECIFIC TOKENS
// =============================================================================

export const components = {
  /** Sidebar (admin/dashboard) */
  sidebar: {
    bg:           "zinc-950",
    bgHover:      "zinc-900",
    bgActive:     "zinc-800",
    text:         "zinc-400",
    textHover:    "zinc-100",
    textActive:   "white",
    icon:         "zinc-500",
    border:       "zinc-800",
    width:        "16rem",    // 256px
    collapsed:    "4rem",     // 64px
  },

  /** Cards */
  card: {
    bg:           "zinc-900/50",
    border:       "zinc-800",
    borderHover:  "zinc-700",
    shadow:       "0 1px 3px rgb(0 0 0 / 0.3)",
    radius:       "1rem",     // 16px — rounded-2xl
  },

  /** Form inputs */
  input: {
    bg:           "zinc-900/50",
    border:       "zinc-800",
    borderHover:  "zinc-700",
    borderFocus:  "indigo-500",
    text:         "zinc-100",
    placeholder:  "zinc-500",
    label:        "zinc-400",
    radius:       "0.75rem",  // 12px — rounded-xl
  },

  /** Buttons */
  button: {
    primary:      "bg-gradient-to-r from-indigo-600 to-indigo-700",
    primaryHover: "from-indigo-500 to-indigo-600",
    secondary:    "border border-zinc-700 bg-surface text-muted-foreground",
    secondaryHover: "border-zinc-500 text-white bg-zinc-800",
    ghost:        "text-zinc-400",
    ghostHover:   "text-zinc-100 bg-zinc-800/50",
    danger:       "bg-gradient-to-r from-red-600 to-red-700",
    radius:       "0.75rem",
  },
} as const;

// =============================================================================
// 12. CHART COLORS (12-color palette for analytics)
// =============================================================================

export const chartColors = [
  "#6366f1",  // indigo-500   — primary brand
  "#8b5cf6",  // violet-500   — secondary
  "#06b6d4",  // cyan-500     — accent
  "#f59e0b",  // amber-500    — warning
  "#10b981",  // emerald-500  — success
  "#f472b6",  // pink-400     — decorative
  "#a78bfa",  // violet-400   — light secondary
  "#34d399",  // emerald-400  — light success
  "#fb923c",  // orange-400   — light warning
  "#818cf8",  // indigo-400   — light primary
  "#2dd4bf",  // teal-400     — light accent
  "#e879f9",  // fuchsia-400  — decorative
] as const;

// =============================================================================
// 13. STATUS BADGE COLORS
// =============================================================================

export const statusColors = {
  active:     { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  inactive:   { bg: "bg-zinc-500/10",    text: "text-zinc-400",   dot: "bg-zinc-400" },
  draft:      { bg: "bg-zinc-500/10",    text: "text-zinc-400",   dot: "bg-zinc-400" },
  published:  { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  archived:   { bg: "bg-zinc-500/10",    text: "text-zinc-500",   dot: "bg-zinc-500" },
  pending:    { bg: "bg-amber-500/10",   text: "text-amber-400",  dot: "bg-amber-400" },
  processing: { bg: "bg-blue-500/10",    text: "text-blue-400",   dot: "bg-blue-400" },
  completed:  { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  cancelled:  { bg: "bg-red-500/10",     text: "text-red-400",    dot: "bg-red-400" },
  failed:     { bg: "bg-red-500/10",     text: "text-red-400",    dot: "bg-red-400" },
} as const;

// =============================================================================
// 14. RESPONSIVE BREAKPOINTS (for Tailwind config reference)
// =============================================================================

export const screens = {
  sm:  "640px",
  md:  "768px",
  lg:  "1024px",
  xl:  "1280px",
  "2xl": "1536px",
} as const;

// =============================================================================
// 15. ACCESSIBILITY GUIDELINES
// =============================================================================

export const a11y = {
  /** Minimum contrast ratios per WCAG AA */
  contrast: {
    normalText: 4.5,   // :1 — body text
    largeText:  3.0,   // :1 — 18px+ bold or 24px+ regular
    ui:          3.0,  // :1 — UI components
  },
  /** Focus ring */
  focusRing: "2px solid hsl(238 84% 67%)",
  focusOffset: "2px",
  /** Reduced motion */
  reducedMotion: "prefers-reduced-motion: reduce",
} as const;
