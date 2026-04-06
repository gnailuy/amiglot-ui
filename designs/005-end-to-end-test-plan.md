---
description: "End-to-end test plan for Amiglot UI."
whenToUse: "Read when running or updating UI E2E scenarios."
---

# Amiglot UI — End-to-End Test Plan

## 1. Scope
End-to-end coverage for the current UI feature set: authentication, session handling, profile setup (profile details, languages, availability), discovery & matching (dashboard), and connection (handshake).

**Priority focus:** Run the user-path tests (happy path + validation/user error) with all services up. Scenarios that require stopping the API are **optional** for now.

## 2. Test Environment
- UI: Next.js dev server (`npm run dev -- --hostname 127.0.0.1 --port 3000`).
- API: local dev container on port 6176.
- DB: local Postgres (dev).
- Base URL: read from `NEXT_PUBLIC_APP_URL` (example: `https://app.example.com`).
- Localization: UI sets `Accept-Language` for API requests.

## 3. Test Data & Accounts
- Each test case uses a **fresh account** (new email + handle).
- Email format: `test+<timestamp>@example.com`.
- Handle format: `tester<timestamp>`.
- Primary languages for the plan: **Chinese** (native) + **Portuguese** (target).
- Default timezone for checks: `America/Vancouver` unless specified.

### Seed Users (required for Discovery, Matching, and Connection tests)
**When setting up any new test environment, seed users must be created before running E2E tests.**
Run the seed script from the API repo:
```bash
python3 scripts/seed-users.py --api-url http://localhost:6176/api/v1
```
This creates 12 seed users with profiles, languages, and availability configured for the test scenarios below. Since test containers use ephemeral storage, re-run the script each time a test environment is recreated. See the API E2E test plan (§2.1–§2.2) for full seed user details.


Alternatively, load seed data directly via SQL:
```bash
psql -f /path/to/amiglot-api/db/seeds/seed_test_profiles.sql
```
This script is idempotent — it cleans previous seed data before inserting. See the comment block at the end of `seed_test_profiles.sql` for the full expected match matrix.

### Seed User Reference

| # | Handle | Email | Native | Targets | Key Trait |
|---|--------|-------|--------|---------|-----------|
| 1 | alice | test+seed1@example.com | en | zh | Primary test requester |
| 2 | bob | test+seed2@example.com | zh | en | Primary test recipient; blocks Ivan |
| 3 | carlos | test+seed3@example.com | pt-BR, es | en, zh | Multi-lang; bridge match |
| 4 | diana | test+seed4@example.com | en | pt | No time overlap with others |
| 5 | eve | test+seed5@example.com | zh | en | No availability overlap with Alice |
| 6 | frank | test+seed6@example.com | en | zh | Minimal overlap (65 min) with Bob |
| 7 | grace | test+seed7@example.com | zh-Hans | en | Base-language matching test |
| 8 | hiro | test+seed8@example.com | ja | ko | Rare language — no matches |
| 9 | ivan | test+seed9@example.com | en | zh | Blocked by Bob |
| 10 | julia | test+seed10@example.com | zh | en | NOT discoverable |
| 11 | kevin | test+seed11@example.com | en | zh, pt | Multi-target language match |
| 12 | luna | test+seed12@example.com | pt-BR, zh-Hans (adv) | en | Multi-teach language match |
## 4. Authentication & Session Test Cases

### A1. Sign in (fresh account)
**Setup:** New email + handle.
**Steps:**
1. Open Home on `NEXT_PUBLIC_APP_URL`.
2. Click Login and submit the fresh email.
3. Confirm success banner appears.
4. In dev mode, open the `dev_login_url` shown on the page.
5. Verify success message on the Verify page.
6. Return to Home.
**Expected:** User is signed in and Home shows the authenticated state.

### A2. Session persistence
**Setup:** Use a fresh account and complete A1.
**Steps:**
1. Refresh the browser.
2. Navigate away and return to Home.
**Expected:** Session remains signed in; no re-login required.

### A3. Sign out
**Setup:** Use a fresh account and complete A1.
**Steps:**
1. Click Sign out on Home.
2. Return to Home.
**Expected:** Session cleared; Home shows signed-out state.

### A4. Invalid/expired magic link
**Setup:** Use a fresh account.
**Steps:**
1. Open Verify with an invalid token (e.g., modify the token query param).
**Expected:** Error state shown with localized message; no session stored.

## 5. Profile Load & Save Test Cases

### P1. Initial profile load
**Setup:** Fresh account; complete A1.
**Steps:**
1. Open Profile page.
2. Wait for initial load.
**Expected:** Loading state resolves; email + handle fields populated (handle may be empty), timezone shown, discoverable toggle visible.

### P2. Handle availability
**Setup:** Fresh account; complete A1.
**Steps:**
1. Enter a new handle `tester<timestamp>`.
2. Pause until availability check completes.
**Expected:** Availability indicator shows available.

### P2b. Dropdown focus on open
**Setup:** Fresh account; complete A1.
**Steps:**
1. Set a country, language, birth month/year, and timezone.
2. Re-open each dropdown.
**Expected:** The currently selected option is focused and scrolled near the middle of the list.

### P3. Validation on save
**Setup:** Fresh account; complete A1.
**Steps:**
1. Clear timezone and attempt Save.
2. Remove all languages and attempt Save.
**Expected:** Save disabled or validation errors displayed; no API save.

### P4. Successful save (details + languages + availability)
**Setup:** Fresh account; complete A1.
**Steps:**
1. Fill profile details and set timezone.
2. Add Chinese (native) + Portuguese (target) languages.
3. Add availability slot (weekday + time range).
4. Click Save.
**Expected:** Success banner; profile, languages, and availability saved.

### P5. Save error handling
**Setup:** Fresh account; complete A1.
**Steps:**
1. Simulate API failure during save (e.g., stop API or mock 500).
2. Attempt Save.
**Expected:** Error banner shown; inputs preserved.

## 6. Languages Tab Test Cases

### L1. Add/update languages
**Setup:** Fresh account; complete A1.
**Steps:**
1. Add Chinese (native) + Portuguese (target).
2. Update Portuguese to a different proficiency.
**Expected:** Languages list updates and remains valid.

### L2. Remove language edge cases
**Setup:** Fresh account; complete A1.
**Steps:**
1. Remove Portuguese.
2. Attempt to remove the last remaining native language.
**Expected:** Validation prevents zero languages and requires at least one native language.

### L3. Language validation errors
**Setup:** Fresh account; complete A1.
**Steps:**
1. Add duplicate language codes.
2. Leave language code empty.
**Expected:** Errors shown for duplicates and missing code.

### L4. Language ordering persistence
**Setup:** Fresh account; complete A1.
**Steps:**
1. Add three languages.
2. Drag to reorder (move the last to the top).
3. Save profile and refresh the page.
**Expected:** Language order matches the dragged order after reload.

## 7. Availability Tab Test Cases

### V1. Add/edit slot
**Setup:** Fresh account; complete A1.
**Steps:**
1. Add slot with multiple weekdays.
2. Toggle one weekday off again to ensure it can be deselected.
3. Update time range to valid start < end.
**Expected:** Weekday toggles update reliably; slot saved locally and remains valid.

### V2. Grouped weekdays display
**Setup:** Fresh account; complete A1.
**Steps:**
1. Create a slot that includes multiple weekdays (e.g., Mon/Wed/Fri with the same time range).
2. Save and revisit the Availability tab.
**Expected:** The weekdays that share the same time range are displayed together in a single block (not split into multiple blocks).

### V3. Invalid time ranges
**Setup:** Fresh account; complete A1.
**Steps:**
1. Set start time after end time.
**Expected:** Validation error shown; save blocked.

### V4. Remove slot edge case
**Setup:** Fresh account; complete A1.
**Steps:**
1. Remove the only slot.
**Expected:** Validation prevents empty availability.

### V5. Availability ordering persistence (grouped slots)
**Setup:** Fresh account; complete A1.
**Steps:**
1. Create two grouped slots (each with multiple weekdays).
2. Drag to reorder the grouped slots.
3. Save profile and refresh the page.
**Expected:** Grouped slots appear in the dragged order; weekdays sharing the same time range remain grouped together.

## 8. Internationalization (i18n) Test Cases

### I1. Chinese locale
**Setup:** Fresh account; complete A1.
**Steps:**
1. Switch locale to Chinese (e.g., `zh` or `zh-Hans`).
2. Navigate to Login + Profile.
**Expected:** Labels and messages are localized.

### I2. Portuguese locale
**Setup:** Fresh account; complete A1.
**Steps:**
1. Switch locale to Portuguese (e.g., `pt` or `pt-BR`).
2. Trigger a validation error on Profile.
**Expected:** Error message is localized in Portuguese.

## 9. Error & Edge States

### E1. Profile load failure
**Setup:** Fresh account; complete A1.
**Steps:**
1. Simulate API error (500) on profile load.
**Expected:** Error banner shown; user stays on Profile.

### E2. API offline (optional)
**Setup:** Fresh account; complete A1.
**Steps:**
1. Stop the API server.
2. Attempt to Save.
3. Restart the API server after the test.
**Expected:** Error banner shown; inputs preserved.

## 10. Discovery & Matching (Dashboard) Test Cases

### D1. Dashboard loads with matches
**Setup:** Two accounts — User A (teaches English native, targets Chinese, has availability) and User B (teaches Chinese native, targets English, overlapping availability). Both profiles complete and discoverable.
**Steps:**
1. Sign in as User A.
2. Navigate to Dashboard (`/dashboard`).
3. Wait for loading skeletons to resolve.
**Expected:** At least one match card appears showing User B's handle, country, mutual languages (they teach you / you teach them), bridge language, and availability overlap converted to User A's local timezone.

### D2. Dashboard empty state
**Setup:** User A with a target language that no other user teaches.
**Steps:**
1. Sign in as User A.
2. Navigate to Dashboard.
**Expected:** Empty state is displayed with localized "No matches found yet" message and an "Edit Profile" link.

### D3. Dashboard — profile incomplete redirect
**Setup:** Fresh account with no profile saved.
**Steps:**
1. Sign in and navigate to Dashboard.
**Expected:** Redirected to Profile page (or login) with a toast/message: "Complete your profile to discover partners."

### D4. Dashboard — no target languages
**Setup:** User with profile saved but only native languages (no targets).
**Steps:**
1. Sign in and navigate to Dashboard.
**Expected:** Inline message: "Add languages you want to learn to find matches" with a link to Profile.

### D5. Match card displays all mutual languages
**Setup:** User A targets `zh` and `pt`; User B speaks `zh-Hans` (native) and `pt-BR` (level 5), targets English. Both have bridge + overlap.
**Steps:**
1. Sign in as User A and navigate to Dashboard.
**Expected:** User B's card shows both `zh-Hans` and `pt-BR` under "They teach you" section.

### D6. Base-language matching in UI
**Setup:** User A targets `zh`; User B speaks `zh-Hans` (native). Both have bridge + overlap.
**Steps:**
1. Sign in as User A and navigate to Dashboard.
**Expected:** User B appears as a match; no MISSING_MESSAGE errors in console.

### D7. Availability overlap displayed in local time
**Setup:** User A (timezone `America/Vancouver`) and User B overlap on Mon 18:00–20:00 UTC.
**Steps:**
1. Sign in as User A and navigate to Dashboard.
**Expected:** Overlap displayed as "Mon 10:00–12:00" (or equivalent PST/PDT conversion) with "(your time)" label.

### D8. Load More pagination
**Setup:** Enough matching users for User A to span multiple pages (or use a small page size).
**Steps:**
1. Sign in as User A and navigate to Dashboard.
2. Scroll to bottom and click "Load More".
**Expected:** Additional match cards appended; no duplicates. "Load More" hidden when no more results.

### D9. Dashboard i18n — Portuguese locale
**Steps:**
1. Switch locale to `pt-BR`.
2. Navigate to Dashboard.
**Expected:** All labels ("Discover Partners", "They teach you", "your time", etc.) are in Portuguese. No MISSING_MESSAGE errors.

### D10. Dashboard i18n — Chinese locale
**Steps:**
1. Switch locale to `zh` or `zh-Hans`.
2. Navigate to Dashboard.
**Expected:** All labels are in Chinese. No MISSING_MESSAGE errors.

### D11. Dashboard network error
**Setup:** Simulate API failure (e.g., stop API or mock 500).
**Steps:**
1. Navigate to Dashboard.
**Expected:** Error message with retry button; localized error text.

### D12. Level pair display — compact format
**Setup:** Seed DB (`db/seeds/seed_test_profiles.sql` in amiglot-api). Sign in as Alice (test+seed1@example.com).
**Steps:**
1. Navigate to Dashboard.
2. Inspect a match card (e.g., Bob's card).
**Expected:** Language badges show compact level pair format, e.g., `zh (Native → Elementary)` — not the verbose "teaches at Native · learns at Advanced" format. Arrow separates teacher level from learner level.

### D13. Multi-language match card
**Setup:** Seed DB. Sign in as Kevin (test+seed11@example.com) who targets both `zh` and `pt`.
**Steps:**
1. Navigate to Dashboard.
2. Find Luna's card.
**Expected:** Luna's card shows both `pt-BR` and `zh-Hans` under "They teach you", each with level pairs. "You teach them" shows `en` with Kevin's native level → Luna's learner level.

### D14. Three-way language exchange visibility
**Setup:** Seed DB. Sign in as Carlos (test+seed3@example.com) who speaks pt-BR + es native, en intermediate, targets en + zh.
**Steps:**
1. Navigate to Dashboard.
2. Verify Diana's card appears (en↔pt exchange with en as bridge).
3. Verify Kevin's card appears (targets pt, bridge en).
**Expected:** Both matches visible. Diana's card: "They teach you: en (Native → Intermediate)", "You teach them: pt-BR (Native → Beginner)". Kevin's card similar with correct levels.

### D15. Blocked user not shown
**Setup:** Seed DB. Sign in as Bob (test+seed2@example.com) who has blocked Ivan.
**Steps:**
1. Navigate to Dashboard.
**Expected:** Ivan does NOT appear in results. Alice, Frank, Kevin, and other valid matches appear.

### D16. Non-discoverable user hidden
**Setup:** Seed DB. Sign in as Alice (test+seed1@example.com).
**Steps:**
1. Navigate to Dashboard.
**Expected:** Julia (test+seed10, discoverable=false) does NOT appear even though her languages and availability would match.

### D17. No availability overlap — no match
**Setup:** Seed DB. Sign in as Alice (test+seed1@example.com).
**Steps:**
1. Navigate to Dashboard.
**Expected:** Eve (test+seed5) does NOT appear — same language match as Bob but zero availability overlap.

### D18. Minimal overlap threshold
**Setup:** Seed DB. Sign in as Bob (test+seed2@example.com).
**Steps:**
1. Navigate to Dashboard.
2. Find Frank's card.
**Expected:** Frank appears (65 min overlap, just above the 60-min threshold). Overlap shows approximately "1h/week overlap".

### D19. Rare language — empty results
**Setup:** Seed DB. Sign in as Hiro (test+seed8@example.com) who targets Korean.
**Steps:**
1. Navigate to Dashboard.
**Expected:** Empty state — "No matches found yet" — because no seeded user teaches Korean at level ≥ 4.

### D20. Base-language match with seed data
**Setup:** Seed DB. Sign in as Alice (test+seed1@example.com) who targets `zh`.
**Steps:**
1. Navigate to Dashboard.
2. Find Grace's card.
**Expected:** Grace (speaks `zh-Hans` native) appears as a match for Alice's `zh` target via base-language matching. Card shows `zh-Hans` under "They teach you".

### D21. Country flag and age display
**Setup:** Seed DB. Sign in as Alice.
**Steps:**
1. Navigate to Dashboard.
2. Inspect Bob's card header.
**Expected:** Card header shows 🇨🇳 flag, `@bob`, age (calculated from birth_year 1992), and "China" as country name.

## 11. Connection (Handshake) Test Cases

### H1. Connect button on Match Card
**Setup:** Seed DB. Sign in as Alice (test+seed1@example.com).
**Steps:**
1. Navigate to Dashboard.
2. Find a match card (e.g., Bob's).
3. Click the "Connect" button.
**Expected:** A dialog appears with a text input for an optional initial message and "Send Request" / "Cancel" buttons.

### H2. Send connection request from Dashboard
**Setup:** Seed DB. Sign in as Alice.
**Steps:**
1. Navigate to Dashboard.
2. Click "Connect" on Bob's card.
3. Type "Hi Bob! Let's practice Chinese together." in the message field.
4. Click "Send Request".
**Expected:** Toast: "Connection request sent to @bob!". The card now shows "Request Sent" badge; Connect button is disabled.

### H3. Connect button — request already sent
**Setup:** Alice has already sent a pending request to Bob.
**Steps:**
1. Sign in as Alice and navigate to Dashboard.
**Expected:** Bob's card shows "Request Sent" instead of the "Connect" button.

### H4. Connect button — request received
**Setup:** Bob has sent a pending request to Alice.
**Steps:**
1. Sign in as Alice and navigate to Dashboard.
**Expected:** Bob's card shows "Request Received" badge.

### H5. Connections page — incoming tab (default)
**Setup:** Alice has at least one incoming pending request.
**Steps:**
1. Sign in as Alice.
2. Navigate to `/connections`.
**Expected:** Incoming tab is active by default. Request cards show requester handle, country, age, message count, and time since request. "View", "Accept", "Decline" buttons visible.

### H6. Connections page — outgoing tab
**Setup:** Alice has at least one outgoing pending request.
**Steps:**
1. Navigate to `/connections`.
2. Click "Outgoing" tab.
**Expected:** Outgoing request cards show recipient info. "View" and "Cancel Request" buttons visible.

### H7. Connections page — empty state (incoming)
**Setup:** No pending incoming requests for Alice.
**Steps:**
1. Navigate to `/connections` → Incoming tab.
**Expected:** Empty state: "No incoming requests" with description text.

### H8. Connections page — empty state (outgoing)
**Setup:** No pending outgoing requests for Alice.
**Steps:**
1. Navigate to `/connections` → Outgoing tab.
**Expected:** Empty state: "No outgoing requests" with "Discover Partners" link.

### H9. Request detail — view and messaging
**Setup:** Pending request from Alice to Bob with an initial message.
**Steps:**
1. Sign in as Bob.
2. Navigate to `/connections` → click "View" on Alice's request.
**Expected:** Request detail page shows: "Connection request from @alice", language info (mutual teach/learn/bridge), the initial message, message input with remaining count, and "Accept" / "Decline" buttons.

### H10. Pre-accept messaging — send and receive
**Setup:** Pending request from Alice to Bob.
**Steps:**
1. Sign in as Bob, view the request detail.
2. Type "Hello Alice!" and click "Send".
**Expected:** Message appears in the conversation. Remaining message count decreases.
3. Sign in as Alice, view the same request.
**Expected:** Bob's message is visible.

### H11. Pre-accept messaging — limit reached
**Setup:** Bob has sent `PRE_MATCH_MESSAGE_LIMIT` messages on a request.
**Steps:**
1. Sign in as Bob and view the request detail.
**Expected:** Message input is disabled. Text: "Message limit reached. Accept to continue chatting."

### H12. Accept request
**Setup:** Pending request from Alice to Bob.
**Steps:**
1. Sign in as Bob and navigate to the request detail.
2. Click "Accept".
**Expected:** Toast: "You are now connected with @alice!". Redirect away from request detail.

### H13. Decline request — confirmation dialog
**Setup:** Pending request from Alice to Bob.
**Steps:**
1. Sign in as Bob and navigate to the request detail or click "Decline" from inbox.
**Expected:** Confirmation dialog: "Decline this request? @alice won't be notified."
2. Confirm decline.
**Expected:** Toast: "Request declined." Request removed from inbox.

### H14. Cancel request — confirmation dialog
**Setup:** Pending request from Alice to Bob.
**Steps:**
1. Sign in as Alice, go to Outgoing tab, click "Cancel Request" or view detail.
**Expected:** Confirmation dialog: "Cancel your request to @bob?"
2. Confirm cancel.
**Expected:** Toast: "Request canceled." Request removed from outgoing list.

### H15. Navigation — Connections link
**Steps:**
1. Sign in and check the navigation header.
**Expected:** "Connections" link is visible in the main navigation, links to `/connections`.

### H16. Connections i18n — Chinese locale
**Steps:**
1. Switch locale to `zh` or `zh-Hans`.
2. Navigate to `/connections`.
3. View a request detail page.
**Expected:** All labels ("Connections", "Incoming", "Outgoing", "Accept", "Decline", message remaining text, etc.) are in Chinese. No MISSING_MESSAGE errors in console.

### H17. Connections i18n — Portuguese locale
**Steps:**
1. Switch locale to `pt` or `pt-BR`.
2. Navigate to `/connections` and view a request detail.
**Expected:** All labels are in Portuguese. No MISSING_MESSAGE errors.

### H18. Error state — duplicate request
**Setup:** Alice already has a pending request to Bob.
**Steps:**
1. Attempt to send another request to Bob (e.g., via API race or UI manipulation).
**Expected:** Toast: "You already have a pending request with this user."

### H19. Error state — already matched
**Setup:** Alice and Bob are already connected.
**Steps:**
1. Attempt to send a request to Bob.
**Expected:** Toast: "You're already connected!" (if Connect button is still visible, which it shouldn't be).

### H20. Request detail — not pending stale state
**Setup:** Alice views Bob's request detail. Meanwhile Bob declines/cancels from another session.
**Steps:**
1. Alice clicks "Accept" on the now-declined request.
**Expected:** Toast: "This request is no longer pending." List refreshes.

### H21. Connection requests pagination
**Setup:** User with multiple incoming pending requests (enough to span pages).
**Steps:**
1. Navigate to `/connections` → Incoming tab.
2. Scroll to bottom and click "Load More" (if available).
**Expected:** Additional request cards appended; no duplicates. "Load More" hidden when no more results.

## 12. Regression Checklist
- No console errors on Home, Login, Verify, Profile, Dashboard, Connections.
- Forms remain responsive during normal use.
- Navigation between tabs does not reset inputs unexpectedly.
- Connection state changes (accept/decline/cancel) properly update all related views.

## Appendix A: Test Groups by Seed User

Each test group lists the seed users it requires. Create all seed users via the seed script (see §3), then log in as the specified user for each group.

### Group A: Fresh-Account Tests (no seed users)

| Tests | Description |
|-------|-------------|
| §4 Auth (A1–A4), §5 Profile (P1–P5), §6 Languages (L1–L4), §7 Availability (V1–V5), §8 i18n (I1–I2), §9 Errors (E1–E2) | Each test creates a fresh account (`test+<timestamp>@example.com`). No seed data needed. |

### Group B: Dashboard — Basic Discovery

| Tests | Login As | Seed Users Needed | Purpose |
|-------|----------|-------------------|---------|
| D1 (matches load) | Alice (`test+seed1`) | Alice + Bob (+ others) | At least one mutual match appears |
| D5 (multi mutual languages) | Kevin (`test+seed11`) | Kevin + Luna | Card shows multiple "They teach you" languages |
| D6 (base-language zh↔zh-Hans) | Alice (`test+seed1`) | Alice + Grace | `zh-Hans` matched via base `zh` |
| D7 (local time display) | Alice (`test+seed1`) | Alice + Bob | UTC→local timezone conversion |
| D8 (pagination) | Alice (`test+seed1`) | All seed users | Load More with multiple matches |

### Group C: Dashboard — Edge Cases

| Tests | Login As | Seed Users Needed | Purpose |
|-------|----------|-------------------|---------|
| D2 (empty state) | Hiro (`test+seed8`) | Hiro | Targets Korean — no teachers |
| D3 (profile incomplete) | Fresh account | None | Redirected to profile setup |
| D4 (no target languages) | Fresh account (native only) | None | Inline "add target" message |
| D15 (blocked user hidden) | Bob (`test+seed2`) | Bob + Ivan | Ivan blocked, not shown |
| D16 (non-discoverable hidden) | Alice (`test+seed1`) | Alice + Julia | Julia not discoverable |
| D17 (no overlap) | Alice (`test+seed1`) | Alice + Eve | Language match but zero time overlap |
| D18 (minimal overlap) | Bob (`test+seed2`) | Bob + Frank | 65 min overlap, just above threshold |
| D19 (rare language empty) | Hiro (`test+seed8`) | Hiro | No Korean teachers |

### Group D: Dashboard — Seed Card Details

| Tests | Login As | Seed Users Needed | Purpose |
|-------|----------|-------------------|---------|
| D12 (level pair format) | Alice (`test+seed1`) | Alice + Bob | Compact level pair display |
| D13 (multi-language card) | Kevin (`test+seed11`) | Kevin + Luna | Multiple languages on one card |
| D14 (three-way exchange) | Carlos (`test+seed3`) | Carlos + Diana + Kevin | Bridge language visibility |
| D20 (base-language seed) | Alice (`test+seed1`) | Alice + Grace | `zh-Hans` in "They teach you" |
| D21 (country flag + age) | Alice (`test+seed1`) | Alice + Bob | 🇨🇳, @bob, age, "China" |

### Group E: Dashboard — i18n & Errors

| Tests | Login As | Seed Users Needed | Purpose |
|-------|----------|-------------------|---------|
| D9 (Portuguese locale) | Any seed user | Any with matches | Labels in Portuguese |
| D10 (Chinese locale) | Any seed user | Any with matches | Labels in Chinese |
| D11 (network error) | Any | Any | API failure handling |

### Group F: Connection Handshake — Happy Paths

| Tests | Login As | Seed Users Needed | Purpose |
|-------|----------|-------------------|---------|
| H1 (Connect button) | Alice (`test+seed1`) | Alice + Bob | Dialog appears on click |
| H2 (send request) | Alice (`test+seed1`) | Alice + Bob | Request sent, card updates |
| H5 (incoming tab) | Bob (`test+seed2`) | Alice + Bob | Incoming request list |
| H6 (outgoing tab) | Alice (`test+seed1`) | Alice + Bob | Outgoing request list |
| H9 (request detail) | Bob (`test+seed2`) | Alice + Bob | Detail page with messaging |
| H10 (pre-accept messaging) | Bob + Alice | Alice + Bob | Send and receive messages |
| H12 (accept) | Bob (`test+seed2`) | Alice + Bob | Accept and redirect |
| H15 (navigation link) | Any seed user | Any | Connections link in header |
| H21 (pagination) | Bob (`test+seed2`) | Multiple requesters → Bob | Many incoming requests |

### Group G: Connection Handshake — State Changes

| Tests | Login As | Seed Users Needed | Purpose |
|-------|----------|-------------------|---------|
| H3 (already sent badge) | Alice (`test+seed1`) | Alice + Bob | "Request Sent" on card |
| H4 (received badge) | Alice (`test+seed1`) | Bob + Alice | "Request Received" on card |
| H7 (empty incoming) | Fresh or Hiro | Hiro or fresh | No incoming requests |
| H8 (empty outgoing) | Fresh or Hiro | Hiro or fresh | No outgoing requests |
| H11 (message limit) | Bob (`test+seed2`) | Alice + Bob | Input disabled at limit |
| H13 (decline + confirm) | Bob (`test+seed2`) | Alice + Bob | Confirmation dialog |
| H14 (cancel + confirm) | Alice (`test+seed1`) | Alice + Bob | Confirmation dialog |
| H20 (stale state) | Alice (`test+seed1`) | Alice + Bob | Accept after decline |

### Group H: Connection — Errors & i18n

| Tests | Login As | Seed Users Needed | Purpose |
|-------|----------|-------------------|---------|
| H16 (Chinese locale) | Any seed user | Any with requests | Labels in Chinese |
| H17 (Portuguese locale) | Any seed user | Any with requests | Labels in Portuguese |
| H18 (duplicate request) | Alice (`test+seed1`) | Alice + Bob | Already-pending error |
| H19 (already matched) | Alice (`test+seed1`) | Alice + Bob (matched) | Already-connected error |
