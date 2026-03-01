---
description: "Frontend technical specification for Amiglot UI."
whenToUse: "Read when implementing UI features or aligning with frontend technical decisions."
---

# Amiglot — Technical Specification (UI)

## 1. Product Constraints (shared)
- Day-1 multi-language support for all UI and user-facing API messages.
- V1 auth via magic link (dev mode: local link generation when `ENV=dev`).
- Profile: unique handle (letters/numbers/underscore), stored **without** `@` and case-insensitive; UI displays with `@` prefix.
- Avoid gender; store birth year + month only, derive age on the fly.

> Frontend technical constraints and coding standards live in `designs/000-architecture-guidelines.md`.
> Backend technical design (DB schema, queries, migrations) lives in the API repo:
> `amiglot-api/designs/001-technical-specification.md`.

## 2. Shared API Contract
This section defines the **UI ↔ API contract** and stays in the UI repo. The API repo focuses on implementation details and refers back here.

### 2.1 Conventions (shared)
- **Base URL:** `/api/v1` (dev via Caddy: `https://test.gnailuy.com/api/v1`)
- **Auth:** Magic-link session; authenticated requests carry `Authorization: Bearer <access_token>` (or cookie session if we go cookie-based). The contract allows either; UI should treat `Authorization` as the canonical method.
- **Localization:** UI sends `Accept-Language`; API returns localized user-facing messages where applicable.
- **Request IDs:** UI sends `X-Request-Id` (UUID) when available; API echoes `X-Request-Id`.
- **Error shape (all endpoints):**
```json
{
  "error": {
    "code": "string",
    "message": "localized message",
    "details": { "field": "optional detail" }
  }
}
```
- **Pagination:** Cursor-based for lists.
```json
{ "items": [ ... ], "next_cursor": "opaque-string-or-null" }
```
- **Timestamps:** ISO-8601 UTC (`2026-02-13T12:34:56Z`).
- **IDs:** UUID strings.

---
### 2.2 Auth & Session
**POST /auth/magic-link**
Request:
```json
{ "email": "user@example.com" }
```
Response:
```json
{ "ok": true }
```
Notes (API impl): rate limit per email/IP; in `ENV=dev`, return `dev_login_url` instead of sending email.

**POST /auth/verify**
Request:
```json
{ "token": "magic-link-token" }
```
Response:
```json
{
  "access_token": "jwt-or-session-token",
  "user": { "id": "uuid", "email": "..." }
}
```

**POST /auth/logout**
Response:
```json
{ "ok": true }
```

---
### 2.3 Profile
**GET /profile**
Response:
```json
{
  "user": { "id": "uuid", "email": "..." },
  "profile": {
    "handle": "arturo",
    "birth_year": 1992,
    "birth_month": 8,
    "country_code": "CA",
    "timezone": "America/Vancouver",
    "discoverable": true
  },
  "languages": [
    {
      "language_code": "en",
      "level": 5,
      "is_native": true,
      "is_target": false,
      "description": "..."
    }
  ],
  "availability": [
    { "weekday": 1, "start_local_time": "18:00", "end_local_time": "20:00", "timezone": "America/Vancouver" }
  ]
}
```

**PUT /profile**
Create or update profile fields (email is read-only). Full replace of profile fields; use null for optional fields if clearing.
Request:
```json
{
  "handle": "arturo",
  "birth_year": 1992,
  "birth_month": 8,
  "country_code": "CA",
  "timezone": "America/Vancouver"
}
```
Response: same shape as `GET /profile`.

**POST /profile/handle/check**
Request:
```json
{ "handle": "arturo" }
```
Response:
```json
{ "available": true }
```

---
### 2.4 Languages
**PUT /profile/languages**
Replace full list (simpler for V1).
Request:
```json
{ "languages": [ ... ] }
```
Response:
```json
{ "languages": [ ... ] }
```

---
### 2.5 Availability
**PUT /profile/availability**
Replace full list.
Request:
```json
{ "availability": [ ... ] }
```
Response:
```json
{ "availability": [ ... ] }
```

---
### 2.6 Discovery / Matching
**POST /search**
Request:
```json
{
  "target_language": "es",
  "min_level": 3,
  "availability_overlap": true,
  "age_range": { "min": 18, "max": 35 },
  "country_code": "CA",
  "cursor": null,
  "limit": 20
}
```
Response:
```json
{
  "items": [
    {
      "user_id": "uuid",
      "handle": "maria",
      "country_code": "MX",
      "age": 24,
      "languages": [ { "language_code": "es", "level": 5, "is_native": true } ],
      "availability_summary": "Weeknights"
    }
  ],
  "next_cursor": "..."
}
```
Note: `availability_summary` is derived by the API from the user's availability slots (for UI display convenience). The API groups weekly slots into a small set of human‑readable labels (e.g., Weeknights, Weekends, Mornings/Afternoons/Evenings) based on which weekday + time buckets the user has availability in. It is not stored; it is computed on read.

**POST /match-requests**
Create a request.
Request:
```json
{ "recipient_id": "uuid", "initial_message": "Hi!" }
```
Response:
```json
{ "id": "uuid", "status": "pending" }
```

**GET /match-requests?cursor=...&limit=...**
List incoming/outgoing with status.
Response:
```json
{ "items": [ { "id": "uuid", "requester_id": "uuid", "recipient_id": "uuid", "status": "pending", "message_count": 3, "last_message_at": "..." } ], "next_cursor": null }
```

**GET /match-requests/{id}/messages?cursor=...&limit=...**
List pre-accept messages between the two users.
Response:
```json
{ "items": [ { "id": "uuid", "sender_id": "uuid", "body": "...", "created_at": "..." } ], "next_cursor": null }
```

**POST /match-requests/{id}/messages**
Send a pre-accept message. Enforced per-user limit (configurable, e.g. `pre_match_message_limit`).
Request:
```json
{ "body": "Hello" }
```
Response:
```json
{ "id": "uuid", "created_at": "..." }
```

**POST /match-requests/{id}/accept**
Accepts the request and **re-associates the existing pre-accept messages** to the new match (so they appear in `/matches/{id}/messages` without copying).
Response:
```json
{ "ok": true, "match_id": "uuid" }
```

**POST /match-requests/{id}/decline**
Response:
```json
{ "ok": true }
```

**GET /matches?cursor=...&limit=...**
Response:
```json
{ "items": [ { "id": "uuid", "user_a": "uuid", "user_b": "uuid", "created_at": "..." } ], "next_cursor": null }
```

**POST /matches/{id}/close**
Response:
```json
{ "ok": true }
```

---
### 2.7 Messaging
**GET /matches/{id}/messages?cursor=...&limit=...**
Response:
```json
{ "items": [ { "id": "uuid", "sender_id": "uuid", "body": "...", "created_at": "..." } ], "next_cursor": null }
```

**POST /matches/{id}/messages**
Request:
```json
{ "body": "Hello" }
```
Response:
```json
{ "id": "uuid", "created_at": "..." }
```

---
### 2.8 Safety (V1 minimal)
**POST /blocks**
Request:
```json
{ "blocked_id": "uuid", "reason": "optional" }
```
Response:
```json
{ "ok": true }
```

**POST /reports**
Request:
```json
{ "reported_id": "uuid", "message": "..." }
```
Response:
```json
{ "ok": true }
```

---
### 2.9 Admin / Ops (minimal)
**GET /healthz**
Response:
```json
{ "ok": true }
```

**GET /readyz**
Response:
```json
{ "ok": true }
```

**GET /metrics**
Prometheus text format (if enabled). Protected behind admin/internal network.
