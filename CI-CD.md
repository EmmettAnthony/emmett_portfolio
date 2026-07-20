# CI/CD Pipeline — Emmett Anthony Portfolio

Enterprise-grade continuous integration and deployment pipeline built with GitHub Actions.

---

## Pipeline Overview

```
                    ┌──────────────┐
                    │   PR/Push    │
                    └──────┬───────┘
                           ▼
              ┌──────────────────────┐
              │  Dependency Review   │
              │  (supply chain sec)  │
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │   Lint & TypeCheck   │
              │  (ESLint, TS, Prettier)│
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │    Security Scan     │
              │ (CodeQL, Gitleaks,   │
              │  npm audit, Trivy)   │
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │   Full Test Suite    │
              │ (unit, component,    │
              │  api, server-action, │
              │  e2e, perf, a11y)    │
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │   Build & Bundle     │
              │  (Next.js compile,   │
              │   bundle analysis)   │
              └──────────┬───────────┘
                         ▼
              ┌──────────────────────┐
              │  Quality Gate Pass?  │
              └──────┬───────────────┘
                     │
            ┌────────┴────────┐
            ▼                 ▼
     ┌────────────┐   ┌──────────────┐
     │   Deploy   │   │   Preview    │
     │ Production │   │   Deploy     │
     │ (main)     │   │ (develop/*)  │
     └──────┬─────┘   └──────┬───────┘
            ▼                 ▼
     ┌────────────┐   ┌──────────────┐
     │  Smoke     │   │   PR Comment │
     │  Tests     │   │   with URL   │
     └────────────┘   └──────────────┘
```

## Workflow Files

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | Push/PR to main | **Main CI** — lint, typecheck, unit/component/api tests, server action tests, database tests, build, quality gate |
| `lint.yml` | Push/PR to main (path: src/) | **Code Quality** — ESLint, TypeScript strict, Prettier, circular deps, dead code, duplicates |
| `test.yml` | Push/PR/Dispatch | **Full Test Suite** — all test categories with coverage, database integration with PostgreSQL |
| `playwright.yml` | Push/PR/schedule | **E2E Tests** — cross-browser (chromium, firefox, webkit), scheduled weekly, shardable |
| `security.yml` | Push/PR/schedule | **Security** — npm audit, Gitleaks, CodeQL, dependency review, environment validation |
| `performance.yml` | Push/PR/Dispatch | **Performance** — Lighthouse CI on 8+ pages, bundle analysis, vitest performance tests |
| `accessibility.yml` | Push/PR/schedule | **Accessibility** — axe-core tests, Playwright a11y audits, WCAG validation, keyboard nav, color contrast |
| `dependency-review.yml` | PR to main | **Supply Chain** — license compliance, SBOM generation, dependency submission, lockfile validation |
| `build.yml` | Push/PR/Dispatch | **Build** — Next.js compile, Prisma migration, Docker build, cache analysis |
| `release.yml` | Dispatch/Push main | **Release** — version bump, changelog generation, GitHub release, semantic release |
| `deploy.yml` | Push/Release/Dispatch | **Deploy** — Vercel deployment (preview/production), smoke tests, rollback capability |

## Required GitHub Secrets

```env
# === Vercel ===
VERCEL_TOKEN=            # Vercel API token
VERCEL_ORG_ID=           # Vercel organization ID
VERCEL_PROJECT_ID=       # Vercel project ID

# === Database ===
DATABASE_URL=            # PostgreSQL connection string for CI

# === Authentication ===
NEXTAUTH_SECRET=         # NextAuth.js secret
ADMIN_USERNAME=          # Admin dashboard username
ADMIN_PASSWORD=          # Admin dashboard password

# === Email ===
RESEND_API_KEY=          # Resend API key for transactional emails
BREVO_API_KEY=           # Brevo API key for newsletter campaigns
SENDER_EMAIL=            # Verified sender email

# === File Upload ===
UPLOADTHING_SECRET=      # UploadThing secret key
UPLOADTHING_APP_ID=      # UploadThing app ID

# === AI ===
OPENAI_API_KEY=          # OpenAI API key for chatbot

# === Calendar Integrations ===
GOOGLE_CLIENT_ID=        # Google OAuth client ID
GOOGLE_CLIENT_SECRET=    # Google OAuth client secret
OUTLOOK_CLIENT_ID=       # Microsoft OAuth client ID
OUTLOOK_CLIENT_SECRET=   # Microsoft OAuth client secret

# === Storage ===
CLOUDFLARE_R2_ACCESS_KEY=    # Cloudflare R2 access key
CLOUDFLARE_R2_SECRET_KEY=    # Cloudflare R2 secret key

# === Error Tracking ===
SENTRY_AUTH_TOKEN=       # Sentry auth token
NEXT_PUBLIC_SENTRY_DSN=  # Sentry DSN (public)

# === Analytics ===
NEXT_PUBLIC_GA_ID=       # Google Analytics 4 measurement ID
NEXT_PUBLIC_GTM_ID=      # Google Tag Manager container ID

# === Bot Protection ===
NEXT_PUBLIC_TURNSTILE_SITE_KEY=     # Cloudflare Turnstile site key
TURNSTILE_SECRET_KEY=                # Cloudflare Turnstile secret key

# === Rate Limiting ===
UPSTASH_REDIS_REST_URL=     # Upstash Redis REST URL
UPSTASH_REDIS_REST_TOKEN=    # Upstash Redis REST token

# === CI Test Users ===
TEST_ADMIN_EMAIL=        # Admin email for E2E tests
TEST_ADMIN_PASSWORD=     # Admin password for E2E tests
```

## Branch Protection Rules

Configure in GitHub → Settings → Branches → Add rule for `main`:

| Setting | Value |
|---------|-------|
| Require pull request before merging | ✅ |
| Required approvals | 1 |
| Dismiss stale reviews | ✅ |
| Require review from Code Owners | ✅ |
| Require status checks | ✅ |
| Status checks required | `quality-gate`, `lint`, `typecheck`, `test-unit`, `test-component`, `test-api`, `build` |
| Require branches to be up-to-date | ✅ |
| Require conversation resolution | ✅ |
| Include administrators | ✅ |

## Workflow Triggers

```
push:        main, develop, feature/*
pull_request: main
schedule:    weekly (Mon 2-6 AM UTC)
workflow_dispatch: manual trigger with parameters
release:     published
```

## Running Locally

```bash
# Lint
npm run lint

# TypeScript check
npx tsc --noEmit

# All tests
npm run test

# With coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Build
npm run build

# Prisma
npx prisma generate
npx prisma validate
npx prisma migrate deploy
```

## Artifacts & Reports

All reports are uploaded as GitHub Actions artifacts:

| Artifact | Retention | Contents |
|----------|-----------|----------|
| `coverage-report` | 14 days | HTML + JSON coverage |
| `junit-reports` | 14 days | JUnit XML test results |
| `playwright-report` | 30 days | HTML E2E report + traces |
| `lighthouse-report` | 30 days | HTML + JSON audits |
| `npm-audit-report` | 30 days | Vulnerability scan |
| `sbom` | 90 days | SPDX JSON SBOM |
| `next-build` | 7 days | Build output |
| `build-logs` | 30 days | Build log files |

## Monitoring Integration

- **Sentry**: Error tracking in both runtime and CI
- **Vercel Analytics**: Web vitals and traffic monitoring
- **Google Analytics**: User behavior and conversion tracking
- **GitHub Security**: Dependabot alerts, CodeQL findings, secret scanning

## Release Process

1. **Manual**: `workflow_dispatch` with version bump (patch/minor/major)
2. **Automatic**: Semantic release via conventional commits
3. **Outputs**: GitHub release with auto-generated changelog, version tag

## Troubleshooting

### Build Failures
```bash
# Check TypeScript errors
npx tsc --noEmit --pretty

# Check ESLint
npm run lint

# Clear Next.js cache
rm -rf .next
```

### Test Failures
```bash
# Run specific test file
npx vitest run tests/api/invoices

# Run with UI
npm run test:watch

# View coverage
open coverage/index.html
```

### Database Issues
```bash
# Reset database
npx prisma migrate reset --force

# Re-run migrations
npx prisma migrate deploy

# Check schema
npx prisma validate
```

### Vercel Deployment
```bash
# Install CLI
npm i -g vercel

# Link project
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

## Architecture Decisions

### Why separate workflows instead of one monolithic file?
- **Parallel execution**: Independent checks run simultaneously
- **Focused triggers**: Path filters avoid running irrelevant jobs
- **Clear responsibility**: Each workflow has a single purpose
- **Faster feedback**: Lint fails fast without waiting for E2E
- **Maintainability**: Smaller files are easier to understand and modify

### Why PostgreSQL as a service container?
- **Isolation**: Each job gets a clean database
- **Realism**: Tests run against actual PostgreSQL, not SQLite
- **Reproducibility**: Same database engine as production

### Why shared composite actions?
- **DRY**: Setup steps are reused across 10+ workflows
- **Consistency**: Same Node version, cache strategy, install process
- **Versioning**: Actions can be updated independently

### Why Lighthouse CI in CI/CD?
- **Performance budgets**: Fail builds that degrade UX
- **Historical tracking**: Compare scores across commits
- **Core Web Vitals**: LCP, INP, CLS measured automatically

### Why accessibility checks?
- **WCAG AA compliance**: Legal and ethical requirement
- **Automated gates**: Catch regressions before they ship
- **Inclusive design**: Screen reader, keyboard, contrast checks
