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

Conversations hub and chat interface for connected partners. Users with accepted matches can view their conversations, read message history, and send new messages.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Technical Specification](technical-specification.md) | Match & messaging endpoint contract |
| [Connection Handshake](connection-handshake.md) | Accept flow that creates matches |
| [In-App Messaging (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/in-app-messaging.md) | Backend endpoints and data model |
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure, loading states, i18n |
| [Product Definition](product-definition.md) | Messaging requirements |

## Why This Design Exists

With connections accepted, users need a way to communicate. This design defines two new views: a conversations hub (list of active chats) and a chat interface (message history + compose).

## User Flow

Accept connection → Conversations Hub shows new chat → Click chat → Chat Interface → Send messages → Return to Hub

## Routes

| Route | Description |
|-------|-------------|
| `/conversations` | Conversations hub — list of active chats |
| `/conversations/[matchId]` | Chat interface for a specific match |

## Conversations Hub

Route: `/conversations` (protected).

### Components

| Component | Role |
|-----------|------|
| `page.tsx` | Server Component: auth check, initial fetch of matches |
| `conversations-content.tsx` | Client Component: conversation list, polling, empty state |
| `components/conversation-card.tsx` | Single conversation row: partner info + last message snippet |
| `components/empty-state.tsx` | Empty state when no conversations exist |

### Conversation Card

Each card displays:

- **Partner info:** Handle (with `@` prefix), country flag, age
- **Last message snippet:** Truncated to ~80 chars, with sender indicator ("You: ..." or just the message text)
- **Timestamp:** Relative time (e.g., "2m ago", "Yesterday", "May 15") using `Intl.RelativeTimeFormat`
- **Unread indicator:** V1 — no server-side read tracking. Deferred to V2.

Cards are clickable — navigate to `/conversations/[matchId]`.

### Ordering

Conversations sorted by most recent message (or match creation date if no messages yet). This mirrors the API's `GET /matches` ordering.

### Polling

- Poll `GET /matches` every 15 seconds while the tab is visible.
- Pause polling when `document.visibilitychange` fires `hidden`.
- Resume on `visible`.
- Use SWR or a lightweight polling hook wrapping `setInterval` + `fetch`.

### Empty State

When no conversations exist:

> "No conversations yet. Connect with a language partner to start chatting!"

With a link/button to the Discovery Dashboard (`/dashboard`).

## Chat Interface

Route: `/conversations/[matchId]` (protected).

### Components

| Component | Role |
|-----------|------|
| `page.tsx` | Server Component: auth check, initial message fetch |
| `chat-content.tsx` | Client Component: message list, polling, compose input |
| `components/message-bubble.tsx` | Single message: body, timestamp, sent/received alignment |
| `components/compose-input.tsx` | Text input + send button |
| `components/chat-header.tsx` | Partner name, back button, close (unmatch) action |

### Message Display

- Messages from the current user aligned right (sent style).
- Messages from the partner aligned left (received style).
- Each bubble shows: message body, timestamp (relative or absolute depending on age).
- Messages grouped by date with date separators ("Today", "Yesterday", "May 15, 2026").
- Scroll position: on initial load, scroll to the bottom (newest messages). On new poll results, auto-scroll only if already at the bottom.

### Message History Loading

- Initial load: `GET /matches/{id}/messages` (newest 50 messages, DESC order → reversed for display).
- Load older messages: "Load more" button at the top of the message list, using cursor pagination.
- Pre-accept messages appear naturally in the history (they were re-associated to the match on accept).

### Polling for New Messages

- Poll `GET /matches/{id}/messages?since=<latest_known_timestamp>` every 3 seconds while the chat is open and tab is visible.
- Append new messages to the bottom of the list.
- Pause polling when tab is hidden (`document.visibilitychange`).

### Compose Input

- Multi-line text input (auto-expanding textarea, max 4 lines visible).
- Send button (disabled when input is empty or while sending).
- Submit on Enter (Shift+Enter for newline).
- Max length: 2000 characters (match `MATCH_MESSAGE_MAX_LENGTH`). Show character count when > 1800 chars.
- On send: optimistic UI — immediately append the message with a "sending" state, then confirm or show error on API response.

### Error Handling

| Condition | Behavior |
|-----------|----------|
| `ERR_MATCH_CLOSED` | Show banner: "This conversation has been closed." Disable compose input. |
| `ERR_MESSAGE_TOO_LONG` | Inline validation prevents submission. Show character count in red. |
| `ERR_DAILY_MESSAGE_LIMIT` | Toast + disable compose: "You've reached your daily message limit." |
| `ERR_MATCH_NOT_FOUND` | Redirect to `/conversations` with error toast. |
| Send failure (network) | Show retry indicator on the failed message bubble. Tap to retry. |

### Close (Unmatch)

- Accessible from the chat header via a menu/icon button.
- Confirmation dialog: "Are you sure you want to close this conversation? You won't be able to send new messages."
- On confirm: `POST /matches/{id}/close` → redirect to `/conversations` with toast "Conversation closed."

## Navigation

Add "Messages" link to the main navigation header, linking to `/conversations`.

### Navigation Layout

| Link | Route | Position |
|------|-------|----------|
| Dashboard | `/dashboard` | Existing |
| Connections | `/connections` | Existing |
| **Messages** | `/conversations` | **New — after Connections** |
| Profile | `/profile` | Existing |

## Accept Flow Integration

When a connection request is accepted (from `/connections/[requestId]`):

- Current behavior: redirect + toast "You are now connected with @handle!"
- **New behavior:** Redirect to `/conversations/[matchId]` instead of `/connections`, so the user lands directly in the new chat. The match ID is returned by `POST /match-requests/{id}/accept`.

## i18n Keys

All strings under the `messaging.*` namespace. Keys needed across all 11 locale files:

| Key | English (en) |
|-----|-------------|
| `messaging.title` | "Messages" |
| `messaging.empty.title` | "No conversations yet" |
| `messaging.empty.description` | "Connect with a language partner to start chatting!" |
| `messaging.empty.action` | "Find Partners" |
| `messaging.card.you` | "You" |
| `messaging.chat.placeholder` | "Type a message..." |
| `messaging.chat.send` | "Send" |
| `messaging.chat.loadMore` | "Load older messages" |
| `messaging.chat.noMessages` | "No messages yet — say hi!" |
| `messaging.chat.closed` | "This conversation has been closed." |
| `messaging.chat.dailyLimit` | "You've reached your daily message limit." |
| `messaging.chat.sendFailed` | "Failed to send. Tap to retry." |
| `messaging.chat.charCount` | "{count}/{max}" |
| `messaging.close.title` | "Close Conversation" |
| `messaging.close.confirm` | "Are you sure? You won't be able to send new messages." |
| `messaging.close.action` | "Close" |
| `messaging.close.cancel` | "Cancel" |
| `messaging.close.success` | "Conversation closed." |
| `messaging.nav` | "Messages" |
| `messaging.dateSeparator.today` | "Today" |
| `messaging.dateSeparator.yesterday` | "Yesterday" |

## Loading & Disabled States

Following Architecture Guidelines §Loading:

| Element | Loading State |
|---------|--------------|
| Conversation list | Skeleton cards (3–5 placeholder rows) |
| Message history | Skeleton bubbles while initial load |
| Send button | Disabled during send, show spinner |
| Load more button | Disabled + spinner while fetching |
| Close button | Disabled + spinner during API call |

## Component Breakdown

### Conversations Hub

```
/conversations
└── page.tsx (Server: auth + initial data)
    └── conversations-content.tsx (Client: list + polling)
        ├── conversation-card.tsx × N
        ├── conversation-card-skeleton.tsx × 5 (loading)
        └── empty-state.tsx (no conversations)
```

### Chat Interface

```
/conversations/[matchId]
└── page.tsx (Server: auth + initial messages)
    └── chat-content.tsx (Client: messages + polling + compose)
        ├── chat-header.tsx (partner name + back + close)
        ├── message-list.tsx (scrollable area)
        │   ├── date-separator.tsx
        │   └── message-bubble.tsx × N
        ├── message-bubble-skeleton.tsx × 5 (loading)
        └── compose-input.tsx (textarea + send button)
```

## Styling Notes

- Message bubbles: rounded corners, subtle background differentiation (sent vs received).
- Compose area: sticky at bottom of viewport, with top border separator.
- Chat header: sticky at top, partner info + navigation.
- Use existing shadcn/ui components: `Button`, `Textarea`, `Dialog` (for close confirmation), `Skeleton`.
- Responsive: full-width on mobile, max-width container on desktop.
