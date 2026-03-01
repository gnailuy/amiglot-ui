# Amiglot UI — End-to-End Test Plan

## 1. Scope
End-to-end coverage for the current UI feature set: authentication, session handling, and profile setup (profile details, languages, availability).

## 2. Test Environment
- UI: Next.js dev server (`npm run dev -- --hostname 127.0.0.1 --port 3000`).
- API: local dev container on port 6176.
- DB: local Postgres (dev).
- Base URL: read from `NEXT_PUBLIC_APP_URL` (example: `https://test.gnailuy.com`).
- Localization: UI sets `Accept-Language` for API requests.

## 3. Test Data & Accounts
- Each test case uses a **fresh account** (new email + handle).
- Email format: `test+<timestamp>@gnailuy.com`.
- Handle format: `tester_<timestamp>`.
- Primary languages for the plan: **Chinese** (native) + **Portuguese** (target).
- Default timezone for checks: `America/Vancouver` unless specified.

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
1. Enter a new handle `tester_<timestamp>`.
2. Pause until availability check completes.
**Expected:** Availability indicator shows available.

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

## 7. Availability Tab Test Cases

### V1. Add/edit slot
**Setup:** Fresh account; complete A1.
**Steps:**
1. Add slot with multiple weekdays.
2. Update time range to valid start < end.
**Expected:** Slot saved locally and remains valid.

### V2. Invalid time ranges
**Setup:** Fresh account; complete A1.
**Steps:**
1. Set start time after end time.
**Expected:** Validation error shown; save blocked.

### V3. Remove slot edge case
**Setup:** Fresh account; complete A1.
**Steps:**
1. Remove the only slot.
**Expected:** Validation prevents empty availability.

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

### E2. Network offline
**Setup:** Fresh account; complete A1.
**Steps:**
1. Disable network and attempt to Save.
**Expected:** Error banner shown; inputs preserved.

## 10. Regression Checklist
- No console errors on Home, Login, Verify, Profile.
- Forms remain responsive on slow network.
- Navigation between tabs does not reset inputs unexpectedly.
