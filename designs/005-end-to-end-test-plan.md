# Amiglot UI — End-to-End Test Plan

## 1. Scope
End-to-end coverage for the current UI feature set, focusing on user-visible flows and API integration.

## 2. Test Environment
- UI: Next.js dev server (`npm run dev -- --hostname 127.0.0.1 --port 3000`)
- API: local dev container on port 6176
- DB: local Postgres (dev)
- Base URL: `https://test.gnailuy.com` (proxy to local UI)
- Localization: ensure `Accept-Language` is set by the UI

## 3. Test Data
- Use fresh email addresses per run: `test+<timestamp>@gnailuy.com`
- Use predictable handles: `tester_<timestamp>`
- Seed languages: English (native), Spanish (target)

## 4. Authentication & Session
1. Request magic link from login screen.
2. Confirm dev-mode magic link flow opens and creates a session.
3. Verify session persists on refresh.
4. Logout and verify protected pages redirect to login.
5. Invalid/expired magic link shows an error state.

## 5. Profile Setup
1. Create profile with required fields (handle, timezone, country).
2. Handle uniqueness check validates and displays errors.
3. Enforce “at least one native language” requirement.
4. Update profile fields and verify persisted values on reload.

## 6. Languages Management
1. Add native + target languages.
2. Edit a language level and description.
3. Remove a language and verify list updates.
4. Validate errors for missing/invalid levels.

## 7. Availability
1. Add weekly availability slots.
2. Edit a slot and verify summary updates.
3. Remove a slot and confirm persisted state.
4. Validate start < end; reject invalid slots.

## 8. Discovery & Matching
1. Run search with filters (target language, min level, age range, country).
2. Validate empty state when no matches.
3. Send a match request with a message.
4. Confirm request appears in outgoing list.

## 9. Match Requests & Messaging
1. As recipient, view incoming request.
2. Send pre-accept message.
3. Accept request and confirm match is created.
4. Open match chat and exchange messages.
5. Decline request flow shows expected UI state.
6. Close match and verify it disappears from active list.

## 10. Internationalization (i18n)
1. Switch UI language (if language selector exists) and verify translations.
2. Validate no hardcoded strings for key views.
3. Confirm locale-sensitive formatting (dates/times) matches selected locale.

## 11. Error & Edge States
1. Simulate API error (500) and verify error banner/toast.
2. Network offline: show retry/empty state.
3. Unauthorized API response redirects to login.
4. Rate-limit response displays user-friendly error.

## 12. Regression Checklist
- Page load performance for main routes.
- Forms remain responsive on slow network.
- No console errors on primary flows.
