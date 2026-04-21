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

| Test | Description |
|------|-------------|
| A1 | Sign in with fresh account |
| A2 | Session persistence across reload |
| A3 | Sign out |
| A4 | Invalid/expired magic link |
| P1 | Initial profile load (empty defaults) |
| P2 | Handle availability check |
| P2b | Dropdown focus on open |
| P3 | Validation on save |
| P4 | Successful save (details + languages + availability) |
| P5 | Save error handling |
| L1 | Add/update languages |
| L2 | Remove language edge cases |
| L3 | Language validation errors |
| L4 | Language ordering persistence |
| V1 | Add/edit availability slot |
| V2 | Grouped weekdays display |
| V3 | Invalid time ranges |
| V4 | Remove slot edge case |
| V5 | Availability ordering (grouped slots) |
| I1 | Chinese locale |
| I2 | Portuguese locale |
| E1 | Profile load failure |
| E2 | API offline (optional) |

### Group B: Dashboard — Basic Discovery

| Test | Login As | Description |
|------|----------|-------------|
| D1 | Alice | Dashboard loads with matches |
| D5 | Alice | Match card displays all mutual languages |
| D6 | Alice | Base-language matching in UI (zh↔zh-Hans) |
| D7 | Alice | Availability overlap displayed in local time |
| D8 | Alice | Load More pagination |
| D13 | Kevin | Multi-language match card |

### Group C: Dashboard — Edge Cases

| Test | Login As | Description |
|------|----------|-------------|
| D2 | Hiro | Empty state (rare language, no matches) |
| D3 | Fresh | Profile incomplete redirect |
| D4 | Fresh | No target languages |
| D15 | Bob | Blocked user not shown (Ivan) |
| D16 | Alice | Non-discoverable user hidden (Julia) |
| D17 | Alice | No availability overlap — no match (Eve) |
| D18 | Alice | Minimal overlap threshold (Frank) |
| D19 | Hiro | Rare language — empty results |

### Group D: Dashboard — Card Details

| Test | Login As | Description |
|------|----------|-------------|
| D12 | Alice | Level pair display — compact format |
| D13 | Kevin | Multi-language match card |
| D14 | Kevin | Three-way language exchange visibility |
| D20 | Alice | Base-language match with seed data (Grace) |
| D21 | Alice | Country flag and age display |

### Group E: Dashboard — i18n & Errors

| Test | Login As | Description |
|------|----------|-------------|
| D9 | Alice | Portuguese locale |
| D10 | Alice | Chinese locale |
| D11 | Alice | Network error handling |

### Group F: Connection — Happy Paths

| Test | Login As | Description |
|------|----------|-------------|
| H1 | Alice | Connect button on Match Card |
| H2 | Alice | Send connection request from Dashboard |
| H5 | Bob | Connections page — incoming tab (default) |
| H6 | Alice | Connections page — outgoing tab |
| H9 | Bob | Request detail — view and messaging |
| H10 | Alice/Bob | Pre-accept messaging — send and receive |
| H12 | Bob | Accept request |
| H15 | Alice | Navigation — Connections link |
| H21 | Bob | Connection requests pagination |

### Group G: Connection — State Changes

| Test | Login As | Description |
|------|----------|-------------|
| H3 | Alice | Already-sent badge |
| H4 | Bob | Received badge |
| H7 | Fresh | Empty state (incoming) |
| H8 | Fresh | Empty state (outgoing) |
| H11 | Alice | Message limit reached |
| H13 | Bob | Decline request — confirmation dialog |
| H14 | Alice | Cancel request — confirmation dialog |
| H20 | Bob | Stale state (not pending) |

### Group H: Connection — Errors & i18n

| Test | Login As | Description |
|------|----------|-------------|
| H16 | Alice | Chinese locale |
| H17 | Alice | Portuguese locale |
| H18 | Alice | Duplicate request error |
| H19 | Alice | Already matched error |

## Current Status

- ✅ `scripts/e2e-test.mjs`: 11 Playwright test scenarios
- ✅ Playwright configured as devDependency
