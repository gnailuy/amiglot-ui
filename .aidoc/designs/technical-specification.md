---
domain: Designs
status: Active
entry_points:
  - src/lib/api.ts
dependencies:
  - .aidoc/architecture/guidelines.md
  - .aidoc/designs/product-definition.md
---

# Technical Specification — UI ↔ API Contract

Shared API contract between frontend and backend. The API repo focuses on implementation; this doc defines the interface.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure for consuming these endpoints |
| [Product Definition](product-definition.md) | Product requirements these endpoints serve |
| [API Contract (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/api-contract.md) | Server-side implementation of this contract |
| [Discovery Dashboard](discovery-dashboard.md) | UI consuming the discovery endpoint |
| [Connection Handshake](connection-handshake.md) | UI consuming the connection endpoints |

## Why This Doc Exists

Single source of truth for the UI ↔ API contract. Frontend and backend teams reference this to stay aligned on request/response shapes, error formats, and auth conventions.

## Conventions

- **Base URL:** `/api/v1`
- **Auth:** `Authorization: Bearer <access_token>` (magic link session)
- **Localization:** UI sends `Accept-Language`; API returns localized messages
- **Request IDs:** UI sends `X-Request-Id` (UUID); API echoes it
- **Error shape:** `{ error: { code, message, details } }`
- **Pagination:** Cursor-based — `{ items: [...], next_cursor: "..." }`
- **Timestamps:** ISO-8601 UTC
- **IDs:** UUID strings

## Auth Endpoints

- `POST /auth/magic-link` — request magic link (dev mode: returns `dev_login_url`)
- `POST /auth/verify` — verify token, returns `access_token` + user
- `POST /auth/logout` — clear session

## Profile Endpoints

- `GET /profile` — returns user, profile, languages, availability
- `PUT /profile` — create/update profile fields (email read-only)
- `POST /profile/handle/check` — check handle availability
- `PUT /profile/languages` — replace full language list (with `order`)
- `PUT /profile/availability` — replace full availability list (with `order`)

## Discovery Endpoint

`GET /api/v1/matches/discover?cursor=<opaque>&limit=<int>` — paginated matching partners with supply/demand/bridge checks and availability overlap. See `amiglot-api/.aidoc/designs/discovery-matching.md` for full contract.

## Connection Endpoints

- `POST /match-requests` — create request with optional `initial_message`
- `GET /match-requests` — list incoming/outgoing with status filter
- `GET /match-requests/{id}/messages` — pre-accept message list
- `POST /match-requests/{id}/messages` — send pre-accept message (enforced limit)
- `POST /match-requests/{id}/accept` — accept (re-associates messages to match)
- `POST /match-requests/{id}/decline` — decline request

## Match & Messaging Endpoints

- `GET /matches` — list accepted matches
- `POST /matches/{id}/close` — unmatch
- `GET /matches/{id}/messages` — match message list
- `POST /matches/{id}/messages` — send match message

## Safety Endpoints

- `POST /blocks` — block user
- `POST /reports` — report user

## Health

- `GET /healthz` — basic health
- `GET /readyz` — DB connectivity
- `GET /metrics` — Prometheus (admin only)
