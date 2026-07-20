# Development Guide — Emmett Anthony Portfolio

## Prerequisites

- **Node.js** 20+ (use `nvm use` if available)
- **npm** 10+
- **PostgreSQL** 16+ (for local database)
- **Git**

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd emmett_portofolio

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values
# Required: DATABASE_URL, NEXTAUTH_SECRET

# Set up the database
npx prisma generate
npx prisma db push
npx prisma db seed

# Start development server
npm run dev
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript type checking |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode tests |
| `npm run test:coverage` | Tests with coverage report |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run analyze` | Bundle analysis |

## Project Structure

```
emmett_portofolio/
├── .github/               # GitHub Actions & templates
│   ├── workflows/         # CI/CD pipeline definitions
│   ├── actions/           # Reusable composite actions
│   └── PULL_REQUEST_TEMPLATE.md
├── .husky/                # Git hooks
├── prisma/                # Database schema & migrations
│   ├── schema.prisma
│   └── seed.ts
├── public/                # Static assets
├── src/
│   ├── app/               # Next.js App Router pages & API routes
│   │   ├── api/           # API route handlers
│   │   ├── blog/          # Blog pages
│   │   ├── portfolio/     # Portfolio pages
│   │   └── ...
│   ├── components/        # React components
│   │   ├── ui/            # UI primitives (shadcn/ui)
│   │   ├── layout/        # Layout components
│   │   ├── home/          # Home page components
│   │   ├── contact/       # Contact components
│   │   ├── blog/          # Blog components
│   │   └── ...
│   ├── lib/               # Utility functions & shared logic
│   │   ├── email/         # Email templates & services
│   │   ├── calendar/      # Calendar integration
│   │   ├── ai/            # AI/chatbot integration
│   │   └── ...
│   ├── actions/           # Server Actions
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   ├── i18n/              # Internationalization
│   ├── messages/          # Translation strings
│   └── data/              # Static data & site config
├── tests/                 # Test files (vitest)
│   ├── unit/
│   ├── component/
│   ├── api/
│   ├── e2e/              # Playwright E2E tests
│   └── ...
├── e2e/                   # Playwright test specs
├── CI-CD.md               # CI/CD pipeline documentation
├── GIT_WORKFLOW.md         # Git workflow guide
├── DEVELOPMENT.md          # This file
└── CONTRIBUTING.md         # Contributing guidelines
```

## Database

### Local Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Open Prisma Studio (GUI)
npx prisma studio

# Run seed script
npm run db:seed
```

### Migrations

```bash
# Create migration
npx prisma migrate dev --name description_of_change

# Apply to production
npx prisma migrate deploy

# Reset (drops all data)
npx prisma migrate reset
```

## Testing Strategy

| Layer | Tool | Location | Purpose |
|-------|------|----------|---------|
| Unit | Vitest | `tests/unit/` | Pure function/logic tests |
| Component | Vitest + Testing Library | `tests/component/` | UI component rendering & interaction |
| API | Vitest | `tests/api/` | API route handler tests |
| Server Action | Vitest | `tests/server-actions/` | Server Action tests |
| Database | Vitest + Prisma | `tests/database/` | Database integration tests |
| E2E | Playwright | `e2e/` | Full browser user flows |
| Security | Vitest | `tests/security/` | Security & access control |
| Performance | Vitest + Lighthouse | `tests/performance/` | Performance regression checks |
| Accessibility | axe-core | `tests/accessibility/` | WCAG compliance |

### Running Tests

```bash
# All tests
npm test

# Specific category
npx vitest run tests/api/
npx vitest run tests/component/ContactForm.test.tsx

# E2E (requires running dev server)
npm run test:e2e

# With coverage
npm run test:coverage
```

## Environment Variables

See `.env.example` for all required variables. Key variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js encryption secret |
| `RESEND_API_KEY` | Yes | Email service API key |
| `UPLOADTHING_SECRET` | Yes | File upload service |
| `OPENAI_API_KEY` | Yes | AI chatbot integration |
| `GOOGLE_CLIENT_ID` | Yes | Google Calendar OAuth |
| `NEXT_PUBLIC_GA_ID` | Yes | Google Analytics |

## Code Style

- **TypeScript**: Strict mode enabled, all new code must be typed
- **ESLint**: Config in `eslint.config.mjs`, extends `next/core-web-vitals`
- **Prettier**: Formatting via ESLint (no separate config file)
- **Components**: Use functional components with TypeScript, shadcn/ui primitives
- **CSS**: Tailwind CSS v4 with `tw-animate-css`
- **Imports**: Group by external → internal, use path aliases (`@/`)

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(blog): add rich text editor
fix(auth): resolve login redirect loop
chore(ci): add performance workflow
```

See [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for full details.
