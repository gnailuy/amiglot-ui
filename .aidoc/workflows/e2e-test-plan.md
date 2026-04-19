---
domain: Workflows
status: Active
entry_points:
  - scripts/e2e-test.mjs
dependencies:
  - .aidoc/designs/technical-specification.md
  - .aidoc/designs/discovery-dashboard.md
  - .aidoc/designs/connection-handshake.md
---

# End-to-End Test Plan

E2E coverage for the UI: auth, session, profile, languages, availability, discovery dashboard, and connection handshake.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Technical Specification](../designs/technical-specification.md) | API contract under test |
| [Discovery Dashboard](../designs/discovery-dashboard.md) | Dashboard UI being tested |
| [Connection Handshake](../designs/connection-handshake.md) | Connection UI being tested |
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure |

## Why This Plan Exists

Validates the full user journey end-to-end through the browser: auth flows, profile setup, discovery, and connection handshake. Catches integration issues between UI and API.

## Test Environment

- UI: Next.js dev server on port 3000
- API: local dev container on port 6176
- DB: local Postgres
- Base URL: from `NEXT_PUBLIC_APP_URL`
- Tooling: Playwright headless

## Test Data

- Fresh accounts: `test+<timestamp>@example.com`, handle `tester<timestamp>`
- Discovery/connection tests: 12 seed users via `scripts/seed-users.py` from API repo
- Primary test languages: Chinese (native) + Portuguese (target)

### Seed Users

Same 12 seed users as API E2E plan (alice through luna). See API `.aidoc/workflows/e2e-test-plan.md` for full reference table.

## Test Groups

### Group A: Fresh-Account Tests (no seed data)
Auth (sign in, session persistence, sign out, invalid link), profile (load, handle check, validation, save, error handling), languages (add/update, remove edge cases, validation, ordering), availability (add/edit, grouped display, invalid ranges, remove, ordering), i18n (Chinese/Portuguese), error states.

### Group B: Dashboard — Basic Discovery
Login as Alice/Kevin. Tests: matches load, multi-language card, base-language matching, local time display, pagination.

### Group C: Dashboard — Edge Cases
Empty state (Hiro), profile incomplete redirect, no target languages, blocked user hidden, non-discoverable hidden, no overlap, minimal overlap threshold, rare language empty.

### Group D: Dashboard — Card Details
Level pair format, multi-language card, three-way exchange, base-language seed, country flag + age.

### Group E: Dashboard — i18n & Errors
Portuguese/Chinese locale, network error handling.

### Group F: Connection — Happy Paths
Connect button, send request, incoming/outgoing tabs, request detail, pre-accept messaging, accept, navigation link, pagination.

### Group G: Connection — State Changes
Already-sent badge, received badge, empty states, message limit, decline/cancel confirmations, stale state.

### Group H: Connection — Errors & i18n
Chinese/Portuguese locale, duplicate request, already matched errors.

## Current Status

- ✅ `scripts/e2e-test.mjs`: 11 Playwright test scenarios
- ✅ Playwright configured as devDependency
