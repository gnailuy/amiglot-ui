---
description: "Design document for the Connection (Handshake) UI vertical slice — connection requests inbox, request actions, pre-accept messaging."
whenToUse: "Read when implementing the connection request inbox, request cards, accept/decline flows, or pre-accept messaging UI."
---

# Connection (Handshake) — Frontend Design

> Parent docs: `000-architecture-guidelines.md` (coding standards), `003-technical-specification.md` (API contract §2.6).
> Backend design: `amiglot-api/designs/005-connection-handshake-design.md`.
> Prior slice: `006-discovery-matching-design.md` (discovery dashboard that leads into connection requests).

## 1. Overview

This slice enables users to **connect** with discovered partners. It adds:

1. A **"Connect" button** on Match Cards (discovery dashboard).
2. A **Connection Requests Inbox** page to view incoming/outgoing requests.
3. **Accept/Decline** actions on incoming requests.
4. A **pre-accept messaging** panel for limited conversation before accepting.

## 1.1 Loading & Disabled States

All components in this slice follow the **Loading & Disabled States** principle defined in `000-architecture-guidelines.md` §7. Buttons (Connect, Accept, Decline, Cancel, Send Message) are disabled during initial load and while requests are in-flight; lists show skeleton placeholders while fetching.

## 2. User Flow

```
Discovery Dashboard
  └── Click "Connect" on a Match Card
        └── Optional: write initial message
              └── Request created (status: pending)

Connection Requests Inbox
  ├── Incoming tab
  │     └── View request → Read messages → Accept / Decline
  └── Outgoing tab
        └── View request → Read messages → Cancel
```

## 3. Route & Page Structure

### 3.1 Routes

```
/connections              # Connection requests inbox
/connections/[requestId]  # Single request detail + messaging
```

Both are protected routes (require authentication).

### 3.2 Component Hierarchy

```
src/app/connections/
├── page.tsx                          # Server Component: auth check, initial fetch
├── connections-content.tsx           # Client Component: tabs, list, pagination
├── components/
│   ├── request-card.tsx              # Individual request card
│   ├── request-card-skeleton.tsx     # Loading skeleton
│   └── empty-state.tsx              # Empty state per tab
├── [requestId]/
│   ├── page.tsx                      # Server Component: fetch request + messages
│   ├── request-detail.tsx            # Client Component: messaging + actions
│   └── components/
│       ├── message-bubble.tsx        # Single message display
│       ├── message-input.tsx         # Compose message input
│       └── action-bar.tsx            # Accept/Decline/Cancel buttons
```

## 4. Discovery Dashboard Changes

### 4.1 Connect Button on Match Cards

Update the existing Match Card component (`dashboard/components/match-card.tsx`):

- Replace the placeholder "Send Request" button with a functional **"Connect"** button.
- On click, show a lightweight modal/dialog:
  - Text input for optional initial message (max 500 chars).
  - "Send Request" and "Cancel" buttons.
- On submit, call `POST /api/v1/match-requests`.
- On success: toast confirmation, visually mark the card as "Request Sent" (disable the Connect button, show status badge).
- On error: show localized error message from the API.

### 4.2 Request State on Match Cards

If a pending request already exists for a displayed match candidate, the Match Card should show "Request Sent" or "Request Received" instead of the Connect button. This requires either:
- A lightweight check via the discovery endpoint (future: include `request_status` in discover response), or
- A client-side set of known pending request recipient IDs, fetched once on dashboard load.

**V1 approach:** Fetch outgoing pending requests on dashboard mount and maintain a client-side `Set<userId>` for quick lookup.

## 5. Connection Requests Inbox

### 5.1 page.tsx (Server Component)

- Auth boundary check.
- Fetch initial page of incoming pending requests.
- Pass to `ConnectionsContent`.

### 5.2 connections-content.tsx (Client Component)

- **Two tabs:** "Incoming" (default) and "Outgoing".
- Each tab fetches its own paginated list via `GET /api/v1/match-requests?direction=<dir>&status=pending`.
- "Load More" pagination (same pattern as discovery dashboard).
- Badge on tab showing count of pending requests (fetch count from API or derive from list).

### 5.3 Request Card

Each request card shows:

```
┌──────────────────────────────────────┐
│  🇲🇽  @maria  · 24 · Mexico          │
│                                      │
│  💬 1 message · Sent 2h ago          │
│                                      │
│  [ View ]  [ Accept ]  [ Decline ]   │
│                    (incoming only)    │
│  [ View ]  [ Cancel ]                │
│                    (outgoing only)    │
└──────────────────────────────────────┘
```

**Fields:**
- Partner handle, country flag, age (same as Match Card).
- Message count and time since last message.
- Action buttons based on direction.

## 6. Request Detail & Pre-Accept Messaging

### 6.1 request-detail.tsx

Navigating to `/connections/[requestId]` shows:

```
┌──────────────────────────────────────┐
│  ← Back to Inbox                     │
│                                      │
│  Connection Request from @maria      │
│  🇲🇽 · 24 · Mexico                    │
│                                      │
│  🎓 They teach you: Spanish (Native) │
│  📚 You teach them: English (Adv.)   │
│  🌉 Bridge: English                  │
│                                      │
│  ─────── Messages ───────            │
│                                      │
│  @maria: Hi! I'd love to practice    │
│          Spanish with you.           │
│                           2h ago     │
│                                      │
│  ─────────────────────────           │
│  [ Type a message...        ] [Send] │
│  2/5 messages remaining              │
│                                      │
│  [ Accept ]  [ Decline ]             │
└──────────────────────────────────────┘
```

### 6.2 Message Limit Display

- Show remaining message count: `{remaining}/{limit} messages remaining`.
- When limit reached, disable input and show: "Message limit reached. Accept to continue chatting."
- The limit is per-user per-request (both sides get their own quota).

### 6.3 Accept Flow

On accept:
1. Call `POST /api/v1/match-requests/{id}/accept`.
2. On success: redirect to match conversation at `/connections` or a future chat route, show toast "You are now connected with @maria!".
3. Pre-accept messages are automatically preserved in the match conversation (handled server-side).

### 6.4 Decline Flow

On decline:
1. Confirmation dialog: "Decline this request? @maria won't be notified."
2. Call `POST /api/v1/match-requests/{id}/decline`.
3. On success: return to inbox, remove from list.

### 6.5 Cancel Flow (Outgoing)

On cancel:
1. Confirmation dialog: "Cancel your request to @maria?"
2. Call `POST /api/v1/match-requests/{id}/cancel`.
3. On success: return to inbox, remove from list.

## 7. Navigation

Add to the main navigation:
- **"Connections"** link → `/connections`
- Show a badge/dot when there are pending incoming requests (poll or derive from periodic fetch).

## 8. Error States

| Condition | UI Behavior |
|-----------|-------------|
| Network error on send request | Toast with retry option |
| `ERR_REQUEST_EXISTS` | Toast: "You already have a pending request with this user" |
| `ERR_ALREADY_MATCHED` | Toast: "You're already connected!" with link to match |
| `ERR_USER_BLOCKED` | Toast: "This action is not available" |
| `ERR_NOT_PENDING` | Toast: "This request is no longer pending" + refresh list |
| `ERR_MESSAGE_LIMIT` | Disable input, show limit reached message |
| Loading inbox | Skeleton cards (3–4 placeholders) |
| Empty inbox | Tab-specific empty state |

## 9. Empty States

**Incoming (no pending requests):**
```
┌──────────────────────────────────────┐
│         📭                           │
│                                      │
│   No incoming requests               │
│                                      │
│   When someone wants to connect      │
│   with you, their request will       │
│   appear here.                       │
└──────────────────────────────────────┘
```

**Outgoing (no pending requests):**
```
┌──────────────────────────────────────┐
│         📤                           │
│                                      │
│   No outgoing requests               │
│                                      │
│   Find partners on the Discovery     │
│   page and send them a request!      │
│                                      │
│   [ Discover Partners ]              │
└──────────────────────────────────────┘
```

## 10. i18n Strings

All new strings must be added to all supported locale files:

```json
{
  "connections": {
    "title": "Connections",
    "tabs": {
      "incoming": "Incoming",
      "outgoing": "Outgoing"
    },
    "requestCard": {
      "messageCount": "{count} message | {count} messages",
      "sentAgo": "Sent {time}",
      "view": "View",
      "accept": "Accept",
      "decline": "Decline",
      "cancel": "Cancel Request"
    },
    "detail": {
      "requestFrom": "Connection request from {handle}",
      "requestTo": "Your request to {handle}",
      "messagesRemaining": "{remaining}/{limit} messages remaining",
      "messageLimitReached": "Message limit reached. Accept to continue chatting.",
      "typeMessage": "Type a message...",
      "send": "Send"
    },
    "connect": {
      "buttonLabel": "Connect",
      "requestSent": "Request Sent",
      "requestReceived": "Request Received",
      "dialogTitle": "Send Connection Request",
      "dialogDescription": "Write an optional message to introduce yourself.",
      "initialMessagePlaceholder": "Hi! I'd love to practice with you...",
      "sendRequest": "Send Request",
      "cancel": "Cancel"
    },
    "confirm": {
      "declineTitle": "Decline Request",
      "declineDescription": "Decline this request? {handle} won't be notified.",
      "cancelTitle": "Cancel Request",
      "cancelDescription": "Cancel your request to {handle}?"
    },
    "empty": {
      "incomingTitle": "No incoming requests",
      "incomingDescription": "When someone wants to connect with you, their request will appear here.",
      "outgoingTitle": "No outgoing requests",
      "outgoingDescription": "Find partners on the Discovery page and send them a request!",
      "discoverPartners": "Discover Partners"
    },
    "toast": {
      "requestSent": "Connection request sent to {handle}!",
      "accepted": "You are now connected with {handle}!",
      "declined": "Request declined.",
      "canceled": "Request canceled.",
      "errorRequestExists": "You already have a pending request with this user.",
      "errorAlreadyMatched": "You're already connected!",
      "errorNotAvailable": "This action is not available.",
      "errorNotPending": "This request is no longer pending.",
      "errorNetwork": "Something went wrong. Please try again."
    }
  }
}
```

## 11. Implementation Checklist

- [ ] Connect dialog: modal/sheet on Match Card "Connect" button
- [ ] Match Card state: track outgoing pending requests, show "Request Sent" badge
- [ ] Route: `src/app/connections/page.tsx`
- [ ] Client component: `connections-content.tsx` (tabs + pagination)
- [ ] Request card: `components/request-card.tsx`
- [ ] Skeleton: `components/request-card-skeleton.tsx`
- [ ] Empty states: `components/empty-state.tsx` (per tab)
- [ ] Route: `src/app/connections/[requestId]/page.tsx`
- [ ] Request detail: `request-detail.tsx` (messaging + actions)
- [ ] Message components: `message-bubble.tsx`, `message-input.tsx`, `action-bar.tsx`
- [ ] Navigation: Add "Connections" link with pending badge
- [ ] i18n: Add `connections.*` keys to all locale files
- [ ] Tests: Unit tests for request card, connect dialog, message input, action flows
