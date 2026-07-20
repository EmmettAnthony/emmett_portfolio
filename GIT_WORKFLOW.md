# Git Workflow — Emmett Anthony Portfolio

## Branch Strategy

```
main         ───●────────────────●──────────●──
                ╱                ╱          ╱
develop      ──●──●──●──────────●──●──●────●──
              │  │  │          │  │  │
feature/*    ─●──●──●──        │  │  │
              │  │             │  │  │
bugfix/*     ──●──●─────────────  │  │
              │                   │  │
hotfix/*     ─────────────────────●──●──
```

### Branches

| Branch | Base | Purpose | Protection |
|--------|------|---------|------------|
| `main` | — | Production-ready stable code | Protected — requires PR + CI |
| `develop` | `main` | Integration and testing | Protected — requires PR + CI |
| `feature/*` | `develop` | New features | None |
| `bugfix/*` | `develop` | Bug fixes | None |
| `hotfix/*` | `main` | Emergency production fixes | Requires approval |

### Rules

- **Never commit directly to `main`** — all changes require a PR with CI passing
- **Never commit directly to `develop`** — use feature/bugfix branches
- **Keep branches short-lived** — merge within 1-2 days
- **Delete branches after merging** — keeps the remote clean

## Workflow

### Feature Development

```bash
# 1. Start from latest develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes, commit frequently
git add .
git commit -m "feat(scope): description"

# 4. Push and create PR
git push origin feature/your-feature-name
```

### Creating a Pull Request

1. Push your branch to GitHub
2. Go to the repository on GitHub
3. Click "Compare & pull request"
4. Set base: `develop`, compare: `feature/your-feature-name`
5. Fill out the PR template
6. Request review if applicable
7. Wait for CI checks to pass

### Merging

1. Ensure CI checks pass
2. Get approval (if required)
3. Use **Squash and Merge** for feature branches
4. Delete the branch after merging

### Hotfix Process

```bash
# 1. Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Fix and commit
git add .
git commit -m "fix(critical): description"

# 3. PR into main first
git push origin hotfix/critical-fix
# Create PR targeting main

# 4. After merging to main, also merge to develop
git checkout develop
git merge main
git push origin develop
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description
```

### Types

| Type | Usage | Example |
|------|-------|---------|
| `feat` | New feature | `feat(contact): add contact form with Brevo integration` |
| `fix` | Bug fix | `fix(auth): resolve login session expiry` |
| `chore` | Maintenance | `chore(ci): configure GitHub Actions pipeline` |
| `docs` | Documentation | `docs(readme): update installation guide` |
| `refactor` | Code restructure | `refactor(api): extract validation middleware` |
| `test` | Tests | `test(blog): add unit tests for editor` |
| `perf` | Performance | `perf(images): implement lazy loading` |
| `style` | Formatting | `style(ui): fix button alignment` |

### Scope Examples

- `contact`, `auth`, `blog`, `api`, `ui`, `db`, `ci`, `deps`, `email`, `calendar`

## Pre-commit Hooks

Before every commit, Husky runs:

1. **ESLint** — code quality and style
2. **TypeScript check** — type safety
3. **Unit & Component tests** — prevent regressions

If any check fails, the commit is blocked. Fix the issues and try again.

## CI Pipeline

On every push and PR, GitHub Actions runs:

| Stage | What | Time |
|-------|------|------|
| Lint | ESLint, Prettier, circular deps | ~1m |
| TypeCheck | `tsc --noEmit` | ~1m |
| Tests | Unit, component, API, E2E | ~5m |
| Security | npm audit, CodeQL, secret scan | ~3m |
| Build | Next.js production build | ~2m |
| Perf | Lighthouse, bundle analysis | ~3m |
| A11y | axe-core, WCAG checks | ~2m |
| Deploy | Vercel preview/production | ~3m |

## Release Process

1. Features accumulate on `develop`
2. When ready, create release branch or PR `develop → main`
3. CI runs full pipeline against `main`
4. Merge to `main` triggers Vercel production deployment
5. GitHub Release is auto-generated with changelog

## Troubleshooting

### Commit blocked by hooks

```bash
# Check what failed
npm run lint
npm run type-check
npx vitest run tests/unit/ tests/component/

# Fix issues, then recommit
git add .
git commit -m "fix(scope): resolve linting errors"
```

### Skip hooks (emergency only)

```bash
git commit --no-verify -m "chore: emergency fix"
```
