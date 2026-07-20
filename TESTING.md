# Emmett Portfolio Enterprise Testing Infrastructure

## Overview

Emmett Portfolio uses a comprehensive, multi-layered testing strategy:

| Layer | Tool | Location | Purpose |
|-------|------|----------|---------|
| **Unit** | Vitest | `src/lib/__tests__/`, `tests/unit/` | Business logic, calculations, validations |
| **Component** | Vitest + RTL | `src/components/**/__tests__/`, `tests/component/` | UI component behavior |
| **API** | Vitest + MSW | `tests/api/` | Endpoint contract testing |
| **Integration** | Vitest | `tests/integration/` | Cross-module interaction |
| **E2E** | Playwright | `e2e/`, `tests/e2e/` | Full user flow automation |
| **Security** | Vitest | `tests/security/` | XSS, SQLi, CSRF, rate limiting |
| **Accessibility** | Vitest + axe-core | `tests/accessibility/` | WCAG AA compliance |
| **Performance** | Vitest + Lighthouse CI | `tests/performance/` | Core Web Vitals budgets |
| **Visual** | Playwright | `tests/visual/` | Screenshot diff regression |
| **Database** | Vitest | `tests/database/` | Model validation, relations |
| **Auth** | Vitest | `tests/auth/` | Authentication & authorization |
| **Payments** | Vitest | `tests/payments/` | Payment processing, refunds |

## Quick Start

```bash
# Run all unit/component tests
npm run test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test directory
npx vitest run tests/unit
npx vitest run tests/api
npx vitest run tests/security

# Run E2E tests
npm run test:e2e

# E2E with UI mode
npm run test:e2e:ui
```

## Test Directory Structure

```
tests/
├── unit/                      # Business logic unit tests
│   ├── calculations/          # Invoice, tax, discount calculations
│   ├── validations/           # Zod schema validation tests
│   └── utils/                 # Date, permission, activity helpers
├── component/                 # Component tests (RTL)
│   ├── ui/                    # Button, Table, Modal, Pagination, Dialog
│   ├── forms/                 # Form validation, submission, reset
│   ├── layout/                # Navbar, Sidebar, Footer
│   ├── dashboard/             # Dashboard cards, charts, stats
│   ├── chat/                  # Chat components
│   ├── contact/               # Contact form components
│   └── email/                 # Email campaign components
├── api/                       # API endpoint tests (MSW)
│   ├── auth/                  # Login, register, password reset
│   ├── invoices/              # CRUD, send, refund
│   ├── customers/             # CRUD, search
│   ├── payments/              # Process, refund, webhook
│   ├── bookings/              # Create, cancel, reschedule
│   ├── crm/                   # Leads, deals, activities
│   ├── support/               # Tickets, replies, status
│   ├── email/                 # Send, transactional, campaigns
│   ├── notifications/         # CRUD, preferences
│   ├── admin/                 # Admin CRUD
│   └── newsletter/            # Subscribe, unsubscribe, campaigns
├── server-actions/            # Server action tests
├── auth/                      # Auth & authorization tests
├── database/                  # Prisma model & relation tests
├── payments/                  # Payment processing tests
├── email-tests/               # Brevo integration tests
├── notifications/             # Notification service tests
├── booking/                   # Booking flow tests
├── crm/                       # CRM & support tests
├── security/                  # Security vulnerability tests
├── accessibility/             # WCAG compliance tests
├── e2e/                       # Playwright E2E tests
│   ├── auth/                  # Login/logout flows
│   ├── invoices/              # Invoice CRUD flows
│   ├── bookings/              # Booking flows
│   └── newsletter/            # Newsletter signup flows
├── performance/               # Lighthouse budget tests
├── visual/                    # Visual regression test plans
├── error-handling/            # Error boundary, API error tests
├── activity-log/              # Activity logging tests
├── helpers/                   # Test utilities
│   ├── render/                # Custom render functions
│   ├── assertions/            # Custom assertion helpers
│   └── mock-factories/        # Test data factories
├── mocks/                     # MSW setup
│   ├── handlers/              # Request handlers by domain
│   └── server.ts              # MSW server instance
└── fixtures/                  # Static test data (JSON)
    ├── users/                 # User role fixtures
    └── invoices/              # Invoice state fixtures
```

## Test Utilities

### Custom Render Functions

```typescript
import { render } from "tests/helpers/render/test-utils";
import { renderWithProviders } from "tests/helpers/render/with-providers";

// Basic render with userEvent
const { user, ...view } = render(<MyComponent />);

// Render with providers (QueryClient, Session, Theme)
const { user } = renderWithProviders(<Dashboard />, {
  providerOptions: {
    session: { user: { id: "1", role: "ADMIN" } },
  },
});
```

### Assertion Helpers

```typescript
import { assertOkResponse, assertUnauthorized, assertForbidden } from "tests/helpers/assertions/api-assertions";
import { assertValidationPasses, assertValidationFails, assertFieldError } from "tests/helpers/assertions/validation-assertions";
import { assertLoadingState, assertEmptyState, assertErrorState } from "tests/helpers/assertions/common-assertions";
```

### Mock Factories

```typescript
import { buildMockInvoice, buildMockCustomer, buildMockBooking, buildMockUser } from "tests/helpers/mock-factories";
import { buildPaidInvoice, buildOverdueInvoice } from "tests/helpers/mock-factories/invoice-factory";

const invoice = buildMockInvoice({ status: "PAID", total: 5000 });
const customer = buildMockCustomer({ status: "ACTIVE" });
const adminUser = buildAdminUser();
```

### Database Helpers

```typescript
import { setupPrismaMock, resetPrismaMock } from "tests/helpers/database";

const prisma = setupPrismaMock({
  invoice: { create: { id: "inv-1" }, findMany: [mockInvoice] },
});

// After each test
resetPrismaMock(prisma);
```

### MSW Setup

```typescript
// In your test file:
import { server } from "tests/mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Mock Service Worker (MSW)

All API calls are intercepted at the network level using MSW during tests. Handlers are organized by domain in `tests/mocks/handlers/`. Add new handlers for new API endpoints.

## Fixtures

JSON fixtures in `tests/fixtures/` provide realistic test data covering different states:
- **Users**: admin, super-admin, manager, accountant
- **Invoices**: paid, overdue, draft

## Coverage Goals

| Area | Target |
|------|--------|
| Business Logic | 95-100% |
| API Endpoints | 90%+ |
| Server Actions | 90%+ |
| UI Components | 85%+ |
| Authentication | 100% |
| Payments | 100% |
| Critical User Flows | 100% |

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs:

1. **Static Analysis** - TypeScript, ESLint, dependency check
2. **Unit Tests** - All unit/component tests with coverage
3. **API Tests** - Dedicated API endpoint tests
4. **E2E Tests** - Playwright across Chrome, Firefox, Safari, Edge, mobile
5. **Accessibility** - axe-core WCAG compliance
6. **Security** - Vulnerability scanning
7. **Performance** - Lighthouse budget checks
8. **Database** - Migration + model validation
9. **Build** - Production build
10. **Quality Gate** - Aggregated pass/fail check

## Report Files

- Coverage: `coverage/index.html`
- JUnit: `reports/junit-*.xml`
- Playwright: `playwright-report/`
- Test artifacts: `test-results/`

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **One assertion per test** where possible - Clear failure messages
3. **Use factories over raw objects** - Maintainable test data
4. **Mock at the network level** (MSW) - Don't mock fetch/http directly
5. **Test error states** - Empty, loading, error, edge cases
6. **Data-testid for complex queries** - Avoid brittle CSS selectors
7. **Keep tests fast** - No real DB calls, no network I/O
8. **Parallel execution** - Tests should be independent
9. **Coverage-driven development** - Run `npm run test:coverage` before commits
10. **Follow AAA pattern** - Arrange, Act, Assert
