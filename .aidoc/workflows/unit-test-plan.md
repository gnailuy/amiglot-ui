---
domain: Workflows
status: Active
entry_points:
  - src/app/login/page.tsx
  - src/lib/api.ts
dependencies:
  - .aidoc/architecture/guidelines.md
---

# Unit Test Plan

Unit testing baseline for the Amiglot UI with coverage priorities and tooling.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure under test |
| [Technical Specification](../designs/technical-specification.md) | API contract tested in helpers |

## Why This Plan Exists

Tests validate API helper correctness, session handling, form validation logic, and i18n resolution — areas where bugs directly impact user experience.

## Tooling

- **Test runner:** Vitest
- **UI testing:** React Testing Library (RTL)
- **Environment:** JSDOM
- **Assertions:** @testing-library/jest-dom

## Coverage Priorities

### P0
- **API helpers** (`src/lib/api.ts`): request/response handling, error mapping, header construction
- **Session helpers** (`src/lib/session.ts`): token/user id read/write (mock `localStorage`)
- **Login page** (`src/app/login/page.tsx`): email validation, success/error states, dev login link
- **Verify page** (`src/app/auth/verify/page.tsx`): missing token, success/error, token persistence

### P1
- **Home page**: signed-in vs signed-out rendering, sign-out clears token
- **Profile page (validation)**: handle format/length, timezone, language rules, availability validation
- **Profile page (state transitions)**: tab validation indicators, save disabled when invalid
- **Profile page (ordering)**: reorder updates form state, availability groups share order, save payload only on Save
- **i18n helpers**: locale resolution (`src/i18n/locale.ts`), language option builders

### P2
- **Language switcher UI**, **i18n request helpers**, **middleware config**
- **Profile config data**, **utility helpers** (`cn`)
- **Edge UI states**: empty data, error banners, localization fallbacks

## Environment

- CI: `npm run test:coverage`
- Local: `npm run test` or `npm run test:coverage`
- Mock `fetch` for API helpers; mock `localStorage`/`sessionStorage`

## Current Status

- ✅ Vitest + RTL configured
- ✅ API helper tests, page-level tests (login, verify, profile)
- ✅ Locale + language option helper coverage
