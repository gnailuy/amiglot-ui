---
domain: Designs
status: Active
entry_points:
  - src/app/connections/page.tsx
  - src/app/[locale]/dashboard/components/match-card.tsx
dependencies:
  - .aidoc/designs/discovery-dashboard.md
  - .aidoc/designs/technical-specification.md
  - .aidoc/architecture/guidelines.md
---

# Connection (Handshake) — Frontend Design

UI for connection requests: Connect button on match cards, connection requests inbox, accept/decline/cancel actions, and pre-accept messaging.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Discovery Dashboard](discovery-dashboard.md) | Connect button lives on match cards |
| [Technical Specification](technical-specification.md) | Connection endpoint contract |
| [Connection Handshake (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/connection-handshake.md) | Server-side state machine and endpoints |
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure and loading states |
| [Product Definition](product-definition.md) | Matching and messaging requirements |

## Why This Design Exists

The handshake flow ensures mutual consent before connecting. Pre-accept messaging lets users evaluate compatibility. The UI must handle state transitions (pending → accepted/declined/canceled) gracefully across multiple views.

## User Flow

Discovery Dashboard → Click "Connect" → optional message → request created (pending) → Connection Requests Inbox → View → Accept/Decline/Cancel

## Dashboard Changes

### Connect Button
Replaces placeholder "Send Request" on match cards. Opens a dialog with optional message input (max 500 chars) and "Send Request"/"Cancel" buttons. On success: toast + "Request Sent" badge.

### Request State on Cards
Cards show "Request Sent" or "Request Received" badges for existing pending requests. V1 approach: fetch outgoing pending requests on dashboard mount, maintain client-side `Set<userId>`.

## Connection Requests Inbox

Route: `/connections` (protected). Two tabs: Incoming (default) and Outgoing.

| Component | Role |
|-----------|------|
| `page.tsx` | Server Component: auth, initial fetch |
| `connections-content.tsx` | Client Component: tabs, pagination |
| `components/request-card.tsx` | Request card with partner info + actions |
| `components/empty-state.tsx` | Per-tab empty state |

### Request Card
Shows: partner handle/country/age, message count, time since request. Buttons: View + Accept/Decline (incoming) or View + Cancel (outgoing).

## Request Detail & Messaging

Route: `/connections/[requestId]`. Shows language info (mutual teach/learn/bridge), message thread, compose input with remaining count (`{remaining}/{limit}`), and Accept/Decline or Cancel buttons.

### Accept Flow
`POST /match-requests/{id}/accept` → redirect + toast "You are now connected with @handle!"

### Decline Flow
Confirmation dialog → `POST /match-requests/{id}/decline` → return to inbox

### Cancel Flow
Confirmation dialog → `POST /match-requests/{id}/cancel` → return to inbox

## Navigation

"Connections" link added to main navigation header, linking to `/connections`.

## Error States

| Condition | Behavior |
|-----------|----------|
| `ERR_REQUEST_EXISTS` | Toast: "You already have a pending request with this user" |
| `ERR_ALREADY_MATCHED` | Toast: "You're already connected!" |
| `ERR_USER_BLOCKED` | Toast: "This action is not available" |
| `ERR_NOT_PENDING` | Toast + refresh list |
| `ERR_MESSAGE_LIMIT` | Disable input, show limit message |
| Empty inbox | Tab-specific empty state with contextual message |

## i18n Keys

All strings under `connections.*` namespace: title, tabs, requestCard, detail, connect, confirm, empty, toast. Present in all supported locale files.

## Loading & Disabled States

All buttons (Connect, Accept, Decline, Cancel, Send) follow `000-architecture-guidelines.md` §7: disabled during initial load and in-flight requests. Lists show skeleton placeholders.
