---
domain: Designs
status: Draft
entry_points:
  - src/app/conversations/page.tsx
  - src/app/conversations/[matchId]/page.tsx
dependencies:
  - .aidoc/designs/technical-specification.md
  - .aidoc/designs/connection-handshake.md
  - .aidoc/architecture/guidelines.md
---

# In-App Messaging — Frontend Design

Conversations hub and chat interface for connected partners. Two new routes let users view active chats, read message history, and send new messages within accepted matches.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Technical Specification](technical-specification.md) | Match and messaging endpoint contract |
| [Connection Handshake](connection-handshake.md) | Accept flow that creates matches |
| [In-App Messaging (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/in-app-messaging.md) | Backend endpoints, data model, and polling strategy |
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure, loading states, i18n |
| [Product Definition](product-definition.md) | Messaging requirements |

## Why This Design Exists

With connections accepted, users need a communication surface. This design defines two views — a conversations hub and a chat interface — following established patterns from the connections feature (server components for auth + initial fetch, client components for interactivity and polling).

## What This Design Covers

### Routes

| Route | Purpose |
|-------|---------|
| `/conversations` | Hub listing all active chats, ordered by most recent message |
| `/conversations/[matchId]` | Chat interface with message history and compose input |

### Conversations Hub

The hub displays conversation cards sorted by most recent message (mirroring the API's `GET /matches` ordering). Each card shows the partner's handle, country flag, age, a last-message snippet (~80 chars with sender indicator), and a relative timestamp via `Intl.RelativeTimeFormat`.

The hub polls `GET /matches` every 15 seconds while the tab is visible, pausing on `document.visibilitychange`. An empty state links users to the Discovery Dashboard.

V1 has no server-side read tracking — unread indicators are deferred to V2.

### Chat Interface

Messages display as sent/received bubbles with date separators ("Today", "Yesterday", "May 15, 2026"). Initial load fetches the newest 50 messages (DESC order, reversed for display). A "Load more" button at the top uses cursor pagination for older messages. Pre-accept messages appear naturally since they were re-associated to the match on accept.

New messages are fetched by polling `GET /matches/{id}/messages?since=<latest_timestamp>` every 3 seconds while the tab is visible. Auto-scroll only triggers when the user is already at the bottom.

The compose input is a multi-line auto-expanding textarea (max 4 visible lines). Character count appears above 1800 of the 2000-char limit. Enter sends, Shift+Enter inserts a newline. Sends are optimistic — the message appears immediately with a "sending" state, confirmed or retried on API response.

### Error Handling

| Error | Behavior |
|-------|----------|
| `ERR_MATCH_CLOSED` | Banner disables compose: "This conversation has been closed." |
| `ERR_MESSAGE_TOO_LONG` | Inline validation prevents submission; character count turns red |
| `ERR_DAILY_MESSAGE_LIMIT` | Toast + disabled compose |
| `ERR_MATCH_NOT_FOUND` | Redirect to `/conversations` with error toast |
| Network failure | Retry indicator on the failed message bubble |

### Close (Unmatch)

Accessible from the chat header via a menu button. A confirmation dialog warns the user, then calls `POST /matches/{id}/close` and redirects to `/conversations` with a toast.

### Navigation and Accept Flow Changes

A "Messages" nav link is added after "Connections", linking to `/conversations`. When a connection request is accepted, the redirect target changes from `/connections` to `/conversations/[matchId]` so the user lands directly in the new chat.

### i18n

21 keys under the `messaging.*` namespace across all 11 locale files. Keys cover: page title, empty state, compose UI, error messages, close confirmation, navigation link, and date separators.

## Key Decisions

- **`/conversations` over `/messages`** — avoids confusion with pre-accept messaging on the connections page.
- **Polling over WebSockets** — matches the API's V1 strategy; no new infrastructure.
- **Optimistic sends** — better UX for a chat interface; retry on failure rather than blocking.
- **Accept redirects to chat** — most natural next action after connecting with someone.

## How It Works

Follows the established Server Component (auth + fetch) → Client Component (interactivity) pattern. See `src/app/conversations/page.tsx` and `src/app/conversations/[matchId]/page.tsx` for the page structure. Uses existing shadcn/ui components (`Button`, `Textarea`, `Dialog`, `Skeleton`).

<!-- TODO: (arturo) update entry_points after implementation to reflect actual component file paths -->
