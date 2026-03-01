---
description: "Unit test plan for Amiglot UI."
whenToUse: "Read when adding or updating UI unit tests and ensuring coverage."
---

# Amiglot UI — Unit Test Plan

## 1. Purpose
Establish a unit testing baseline for the UI repo and outline the priority areas for coverage. This plan is the source of truth for UI unit testing going forward.

## 2. Tooling
- **Test runner:** Vitest
- **UI testing:** React Testing Library (RTL)
- **Environment:** JSDOM
- **Assertions:** @testing-library/jest-dom

## 3. Scope & Priorities
### P0 (First wave)
- **API helpers** (`src/lib/api.ts`): request/response handling, error mapping, header construction.
- **Session helpers** (`src/lib/session.ts`): token/user id read/write logic (mock `localStorage`).
- **Login page** (`src/app/login/page.tsx`): email input validation, success/error states, dev login link rendering.
- **Verify page** (`src/app/auth/verify/page.tsx`): missing token state, success/error messaging, token persistence.

### P1
- **Home page** (`src/app/page.tsx`): signed-in vs signed-out rendering, sign-out clears token.
- **Profile page (validation)** (`src/app/profile/page.tsx`):
  - Handle format/length validation and availability state handling.
  - Required timezone and language rules (native language required).
  - Availability validation (weekday required, start < end).
- **Profile page (state transitions)**:
  - Tabs show validation indicators when invalid.
  - Save disabled when validation fails.
- **i18n helpers**:
  - Locale resolution helpers (`src/i18n/locale.ts`).
  - Language option builders (`src/i18n/language-options.ts`).

### P2
- **Language switcher UI** (`src/components/language-switcher.tsx`): renders locale options and updates route.
- **i18n request helpers** (`src/i18n/request.ts`): request locale detection and fallbacks.
- **Middleware config** (`middleware.ts`): locale matcher configuration and defaults.
- **Profile config data** (`src/config/profile-options.ts`): basic sanity checks for months/language lists.
- **Utility helpers** (`src/lib/utils.ts`): `cn` class merge behavior.
- **Edge UI states**: empty data states, error banners, localization fallbacks.

## 4. Test Environment Notes
- CI runs `npm run test:coverage`.
- Local runs: `npm run test` (or `npm run test:coverage` for coverage output).
- Use mocked `fetch` for API helpers and mocked `localStorage`/`sessionStorage` where needed.

## 5. Current Status
- ✅ Test framework installed and configured (Vitest + RTL).
- ✅ Example test added for API helpers.
- ✅ Page-level tests present for login, verify, and profile.
- ✅ Locale + language option helpers covered by unit tests.
