# Amiglot — Technical Specification

## 1. Technical Constraints
**Frontend (UI)**
- Next.js 16.1.6, React 19.2.3, TypeScript 5.x
- ESLint + Prettier, strict lint/typecheck/build in CI

**Backend (API)**
- Go 1.24
- Huma (HTTP framework)
- PostgreSQL with pgx + sqlc, migrations via goose
- API port: 6174

**Product constraints**
- Day‑1 multi‑language support for all UI and user‑facing API messages.
- V1 auth via magic link (dev mode: local link generation when `ENV=dev`).
- Profile: unique handle (letters/numbers only), stored as `@handle`, case‑insensitive.
- Avoid gender; store birth year + month only, derive age on the fly.

## 2. Data Contract
### Database Schema (current)
From `amiglot-api` migrations:

**users**
- `id` UUID PRIMARY KEY
- `email` TEXT UNIQUE NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL DEFAULT now()

> Note: additional profile, match, and messaging tables are TBD and will be added in subsequent migrations.

### API JSON Shapes (current)
**GET /healthz**
```json
{
  "ok": true
}
```

> Note: profile, match, and messaging endpoints and JSON contracts are TBD; they should align with the V1 must‑have flows described in the production definition.
