# Contributing to Emmett Anthony Portfolio

Thank you for your interest in contributing! This document outlines the process for contributing to this project.

## Code of Conduct

Be respectful, inclusive, and constructive. Harassment or toxic behavior will not be tolerated.

## Getting Started

1. **Fork the repository** (if external) or **clone it** (if team member)
2. **Set up the development environment** following [DEVELOPMENT.md](./DEVELOPMENT.md)
3. **Create a branch** following the [branch strategy](./GIT_WORKFLOW.md)

## Development Process

### 1. Find or Create an Issue

- Check existing issues before starting work
- For new features, create an issue first to discuss the approach
- Bug fixes can go directly to a PR

### 2. Create a Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

Branch naming:
- `feature/description` — new features
- `bugfix/description` — bug fixes
- `hotfix/description` — urgent production fixes
- `chore/description` — maintenance tasks

### 3. Implement Changes

- Follow the [code style](./DEVELOPMENT.md#code-style)
- Write tests for new functionality
- Update documentation as needed
- Keep changes focused and atomic

### 4. Run Validation

```bash
# Required checks (also run by pre-commit hook)
npm run lint
npm run type-check
npm run test
npm run build
```

All checks must pass before committing.

### 5. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(scope): concise description"
```

### 6. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a PR on GitHub targeting the `develop` branch.

### 7. PR Review

- Fill out the PR template completely
- Ensure CI checks pass
- Respond to feedback and make requested changes
- A maintainer will merge when approved

## Pull Request Guidelines

- **Keep PRs small** — focused on a single concern (easier to review)
- **Write clear descriptions** — explain what and why, not just how
- **Include tests** — new features should include tests
- **Update documentation** — if changing behavior or adding features
- **Link related issues** — use "Closes #123" in the description

## Coding Standards

### TypeScript

- Strict mode is enabled — avoid `any` unless absolutely necessary
- Use proper TypeScript types for all functions and components
- Prefer interfaces over types for object shapes

### React/Next.js

- Use functional components with hooks
- Server Components by default, add `'use client'` only when needed
- Follow the App Router conventions
- Use shadcn/ui primitives for UI elements

### Testing

- Write tests for all new functionality
- Follow existing test patterns in the codebase
- Aim for meaningful coverage, not 100% for the sake of it

### Git

- Never commit directly to `main` or `develop`
- Write descriptive commit messages
- Rebase or squash before merging to keep history clean

## Questions?

Open a discussion or issue on GitHub, or reach out to the repository maintainer.
