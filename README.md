# Emmett Anthony — Portfolio

Professional portfolio and services platform built with Next.js 15, TypeScript, Prisma, and PostgreSQL. Features include a blog, portfolio showcase, contact management, booking system, AI chatbot, and admin dashboard.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL + Prisma ORM |
| Testing | Vitest + Playwright |
| CI/CD | GitHub Actions |
| Email | Resend + Brevo |
| Auth | NextAuth.js v5 |
| AI | OpenAI / Vercel AI SDK |
| Storage | UploadThing + Cloudflare R2 |
| Monitoring | Sentry + Google Analytics |
| Deployment | Vercel |

## Quick Start

```bash
npm install
cp .env.example .env.local   # fill in your values
npx prisma generate && npx prisma db push && npx prisma db seed
npm run dev
```

## Documentation

| File | Purpose |
|------|---------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Dev setup, scripts, project structure |
| [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) | Branch strategy, commit convention, PR process |
| [CI-CD.md](./CI-CD.md) | CI/CD pipeline architecture and configuration |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contributing guidelines |
| [TESTING.md](./TESTING.md) | Testing strategy |

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # TypeScript check
npm test             # Run tests
npm run test:e2e     # Playwright E2E
npm run db:seed      # Seed database
```

## Branch Structure

```
main        → Production (protected, PR only)
develop     → Integration (protected, PR only)
feature/*   → New features (branch from develop)
bugfix/*    → Bug fixes (branch from develop)
hotfix/*    → Emergency fixes (branch from main)
```

## Project Status

Production deployment at [emmettanthony.dev](https://emmettanthony.dev)
