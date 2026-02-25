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

### P1
- **Auth flows**: login screen behavior + form validation.
- **Profile**: loading state, form validation, and basic submit flows (mock API).

### P2
- **Edge UI states**: empty data states, error boundaries, and localization fallbacks.

## 4. Test Environment Notes
- Tests run via `npm run test` in CI.
- Use mocked `fetch` for API helpers and mocked `localStorage`/`sessionStorage` where needed.

## 5. Current Status
- ✅ Test framework installed and configured (Vitest + RTL).
- ✅ Example test added for API helpers.

## 6. UT Notes Migrated from Technical Spec
No UI unit test notes were present in `designs/003-technical-specification.md` at the time of this plan.
