# Amiglot — Production Specification (Brief)

## 1. Objective
Build Amiglot: a reliable, multilingual platform that helps language learners find compatible partners and move from profile creation to chat quickly and safely. V1 focuses on onboarding, matching, and basic 1:1 messaging with clear anti‑spam limits and a clean admin view.

## 2. User Stories
- As a new learner, I can sign up via magic link, create a profile, and set my native/target languages and levels so I can find relevant partners.
- As a learner, I can search and filter candidates by language pair, level, availability overlap, age (derived), and country.
- As a learner, I can send a match request and, once accepted, start a 1:1 text chat.
- As a learner, I can edit my profile (except email) and keep at least one native language to remain visible.
- As an admin, I can view a minimal dashboard to monitor usage (no reporting/abuse workflows in V1).

## 3. Technical Constraints
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

## 4. Data Contract
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

## 5. Acceptance Criteria (Definition of Done)
- Production definition is indexed and renamed to `001-production-definition.md`.
- A brief production specification exists in `designs/002-production-specification.md` with the sections above.
- Spec aligns with confirmed V1 requirements, constraints, and API stack decisions.
- No breaking changes to app code; documentation‑only change.
