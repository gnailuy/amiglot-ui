# Amiglot — Technical Specification (UI)

## 1. Technical Constraints
**Frontend (UI)**
- Next.js 16.1.6, React 19.2.3, TypeScript 5.x
- ESLint + Prettier, strict lint/typecheck/build in CI

**Product constraints (shared)**
- Day-1 multi-language support for all UI and user-facing API messages.
- V1 auth via magic link (dev mode: local link generation when `ENV=dev`).
- Profile: unique handle (letters/numbers/underscore), stored as `@handle`, case-insensitive.
- Avoid gender; store birth year + month only, derive age on the fly.

> Backend technical design (DB schema, queries, migrations) lives in the API repo:
> `amiglot-api/designs/001-technical-specification.md`.

## 2. Shared API Contract
This section defines the **UI ↔ API contract** and stays in the UI repo. The API repo focuses on implementation details and refers back here.

### 2.1 API JSON Shapes (current)
**GET /healthz**
```json
{
  "ok": true
}
```

> Note: profile, match, and messaging endpoints and JSON contracts are TBD; they should align with the V1 must-have flows described in the production definition.
