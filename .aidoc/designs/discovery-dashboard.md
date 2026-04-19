---
domain: Designs
status: Active
entry_points:
  - src/app/[locale]/dashboard/page.tsx
  - src/app/[locale]/dashboard/dashboard-content.tsx
dependencies:
  - .aidoc/architecture/guidelines.md
  - .aidoc/designs/technical-specification.md
---

# Discovery Dashboard — Frontend Design

Design for the Discovery Dashboard — the main entry point where authenticated users browse potential language exchange partners via `GET /api/v1/matches/discover`.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure rules |
| [Technical Specification](technical-specification.md) | Discovery endpoint contract |
| [Discovery Matching (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/discovery-matching.md) | Server-side matching rules and endpoint |
| [Connection Handshake](connection-handshake.md) | Connect button on match cards leads here |
| [Product Definition](product-definition.md) | Matching rules |

## Why This Design Exists

Discovery is the primary user-facing surface for finding partners. The dashboard must handle complex data (multi-language matches, timezone conversions, pagination) while remaining responsive and accessible.

## Route & Components

Route: `/[locale]/dashboard` (protected, redirects to login if unauthenticated).

| Component | Role |
|-----------|------|
| `page.tsx` | Server Component: auth check, initial data fetch |
| `dashboard-content.tsx` | Client Component: pagination, error handling, card rendering |
| `components/match-card.tsx` | Individual match card |
| `components/match-card-skeleton.tsx` | Loading skeleton |
| `components/empty-state.tsx` | Empty state when no matches |

## Match Card Information

Each card displays: handle (with `@`), country flag + name (via `Intl.DisplayNames`), age, mutual teach/learn languages with level pairs (compact format: `zh (Native → Elementary)`), bridge languages, availability overlap in user's local timezone, total overlap.

## Interactions

- **Connect button** → triggers connection request dialog (see Connection Handshake design)
- **Load More** → appends next page using `next_cursor`; hidden when `next_cursor` is null

## Error & Empty States

| Condition | Behavior |
|-----------|----------|
| Profile incomplete (403) | Redirect to profile with toast |
| No target languages (422) | Inline message with profile link |
| Network error | Retry button with localized message |
| No matches | "No matches found yet" with "Edit Profile" link |
| Loading | 3–4 skeleton cards |

## Availability Time Display

API returns overlap in UTC. UI converts to user's local timezone using `Intl.DateTimeFormat` with the `timeZone` option from the user's profile.

## i18n Keys

All strings under `dashboard.*` namespace: title, loading, loadMore, noMoreResults, empty (title/description/editProfile), errors (profileIncomplete/noTargetLanguages/networkError), card (theyTeachYou/youTeachThem/bridgeLanguage/overlapTime/overlapHours/viewProfile/sendRequest/yourTime/levelPair). Present in all supported locale files.
