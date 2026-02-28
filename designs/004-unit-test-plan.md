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

### P2
- **Profile helpers**: language/availability normalization logic and default state generation.
- **Edge UI states**: empty data states, error banners, localization fallbacks.

## 4. Test Environment Notes
- CI runs `npm run test:coverage`.
- Local runs: `npm run test` (or `npm run test:coverage` for coverage output).
- Use mocked `fetch` for API helpers and mocked `localStorage`/`sessionStorage` where needed.

## 5. Current Status
- ✅ Test framework installed and configured (Vitest + RTL).
- ✅ Example test added for API helpers.
- ✅ Page-level tests present for login, verify, and profile.
