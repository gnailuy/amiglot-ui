# Amiglot UI — End-to-End Test Plan

## 1. Scope
End-to-end coverage for the current UI feature set: authentication, session handling, and profile setup (profile details, languages, availability).

## 2. Test Environment
- UI: Next.js dev server (`npm run dev -- --hostname 127.0.0.1 --port 3000`)
- API: local dev container on port 6176
- DB: local Postgres (dev)
- Base URL: `https://test.gnailuy.com` (proxy to local UI)
- Localization: UI sets `Accept-Language` for API requests

## 3. Test Data
- Use fresh email addresses per run: `test+<timestamp>@gnailuy.com`
- Use predictable handles: `tester_<timestamp>`
- Seed languages: English (native), Spanish (target)

## 4. Authentication & Session
1. From Home, navigate to Login.
2. Submit magic link request and see success state.
3. In dev mode, open `dev_login_url` and verify success message.
4. Verify access token + user id persisted; Home shows signed-in state.
5. Sign out from Home clears session and returns to signed-out state.
6. Invalid/expired magic link shows error state on Verify page.

## 5. Profile Load & Save
1. Open Profile page and confirm initial loading state.
2. Profile fetch populates email, handle, timezone, and discoverable badge.
3. Handle availability check runs for new handles and shows available/unavailable state.
4. Attempt save with invalid fields (handle length/characters, missing timezone) shows validation and disables save.
5. Successful save updates profile, languages, and availability in sequence and shows success banner.

## 6. Languages Tab
1. Add a language with level + description; update to target language.
2. Remove a language; ensure list never becomes empty.
3. Validate language errors:
   - Missing language code
   - Duplicate language codes
   - No native language

## 7. Availability Tab
1. Add availability slot with multiple weekdays.
2. Edit time range; ensure start < end validation.
3. Remove a slot; ensure list never becomes empty.
4. Validate timezone selection (slot timezone overrides profile timezone).

## 8. Internationalization (i18n)
1. Load UI in a non-default locale (if supported) and verify translated labels for Login and Profile.
2. Confirm API errors are localized based on `Accept-Language`.

## 9. Error & Edge States
1. Simulate API error (500) on profile load; verify error banner.
2. Simulate API error on save; verify error banner and no silent failures.
3. Network offline: show error banner and preserve inputs.

## 10. Regression Checklist
- Page load performance for Home, Login, Verify, Profile.
- Forms remain responsive on slow network.
- No console errors on primary flows.
