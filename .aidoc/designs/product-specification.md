---
domain: Designs
status: Active
entry_points: []
dependencies:
  - .aidoc/designs/product-definition.md
---

# Product Specification — User Stories & Action Paths

Detailed user stories and action paths for Amiglot V1 features.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Product Definition](product-definition.md) | V1 scope and matching rules |
| [Technical Specification](technical-specification.md) | API contract for these flows |
| [Architecture Guidelines](../architecture/guidelines.md) | Component structure for implementing these flows |

## Why This Doc Exists

Captures acceptance criteria and flow details that the product definition summarizes. Implementation teams reference this for edge cases and validation rules.

## Onboarding & Profile Stories

- Magic link signup, no passwords
- Profile with unique handle, birth year+month, country, languages
- At least one native language required for profile creation
- Profile editing (except email); must retain one native language
- Availability management with timezone; local time + timezone stored, converted at query time

### Ordering & Drag Behavior
- Drag handles for reordering (pointer + keyboard), updates immediately in UI
- Order persisted only on Save
- Missing `order` on load: keep current list order, normalize on next save
- Availability slots sharing `(start_local_time, end_local_time, timezone)` share the same order

## Discovery & Matching Stories

- Add languages with proficiency level and optional description
- Mutual exchange required: each person learns what the other teaches
- Bridge language required: both users ≥ Intermediate
- Filter by language pair, level, availability overlap, age, country
- View candidate profile, send match request with intro note
- Accept/decline incoming requests; see request status

## Chat Stories

- 1:1 text chat after match acceptance
- Message delivery timestamps
- Unmatch to end chat and disable messaging

## Safety

- Block/report users (minimal V1 workflow)
- Minimal admin dashboard (users, matches, message counts)

## Action Paths

### Sign up → Profile → Discoverable
Email → magic link → auth session → complete profile → validate → set discoverable → visible in search

### Search → View → Send Request
Open search → set filters → results → view candidate → send request → status: pending

### Incoming Request → Accept → Chat
Receive notification → open request → read intro → accept → create match → open chat → send messages

### Edit Profile → Keep Discoverable
Open settings → edit fields → validate (handle uniqueness, native language) → save → remain discoverable

### Unmatch → Close Chat
Open chat → unmatch → close thread → messaging disabled
