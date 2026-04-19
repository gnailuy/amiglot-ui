---
domain: Designs
status: Active
entry_points: []
dependencies:
  - .aidoc/architecture/guidelines.md
---

# Product Definition (Phase 1)

Amiglot product scope, personas, user journeys, matching strategy, and V1 requirements.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Product Specification](product-specification.md) | Detailed user stories and action paths |
| [Technical Specification](technical-specification.md) | UI ↔ API contract |
| [Discovery Dashboard](discovery-dashboard.md) | Discovery UI implementation |

## Why This Doc Exists

Defines what Amiglot is, who it serves, and the V1 scope boundary. All feature decisions reference this doc as the product authority.

## Personas

1. **Serious Learner** — consistent practice, structured goals, matched levels
2. **Casual Partner** — light conversation, flexible schedule

Usage intent is not a profile choice at signup. Helper/Tutor intent is out of scope for V1.

## Top 3 User Journeys

A) Onboarding → Profile → Language goals → Availability → Start searching
B) Discover/match → Browse → Send request → Accept → Open chat
C) Chat → Schedule practice → Keep notes → Continue/adjust

## V1 Must-Have

- Auth: magic link (dev mode: local link generation when `ENV=dev`)
- Profile: native + target languages, level, goals, timezone, availability
- Search/match: filter by language pair, level, availability overlap
- Match request + accept/decline
- Basic 1:1 messaging (text)
- Minimal admin dashboard

## Matching Strategy (V1)

### Language Levels
| Level | Term | Functional Role |
|-------|------|----------------|
| 0–1 | Zero/Beginner | Learner only |
| 2 | Elementary | Weak bridge |
| 3 | Intermediate | Strong bridge (minimum for V1) |
| 4 | Advanced | Teacher |
| 5 | Native | Teacher |

### Matching Checks (All Must Pass)
1. **Supply** — User B has language User A wants at level ≥ 4
2. **Demand** — User A has language User B wants at level ≥ 4
3. **Bridge** — Shared language where both are level ≥ 3

V1 is mutual-only. Strong matches only (strict thresholds).

## Profile Requirements

- Email (read-only after signup)
- Unique handle (letters/numbers, case-insensitive, stored without `@`)
- Languages with levels; at least one native required
- Birth year + month (no date); compute age on the fly
- Country code; display country name via standard mapping
- Avoid gender
- Messaging limits: pre-accept message limit + daily cap (configurable)

## Explicitly Out of Scope (V1)

Payments, video/voice calls, group lessons, AI tutor, calendar sync, reporting/abuse workflows.
