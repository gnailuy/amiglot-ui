# Amiglot — Production Definition (Phase 1)

## Personas
1) **Serious Learner** — wants consistent practice, structured goals, prefers matched levels.
2) **Casual Partner** — wants light conversation practice, flexible schedule.

> Note: **Usage intent is not a required profile choice at signup**. People can explore serious vs. casual matches after registration.
> **Helper/Tutor** intent is out of scope for V1; consider it as a future profile attribute.

## Top 3 user journeys
A) **Onboarding → Profile → Language goals → Availability → (Optional preferences) → Start searching**
B) **Discover/match → Browse candidates → Send request → Accept → Open chat**
C) **Chat → Schedule practice → Keep notes → Continue/adjust**

## V1 must‑have
- Auth/session: **magic link** (dev mode: if `ENV=dev` and no sender, generate login link locally)
- Profile: native + target languages, level, goals, time zone, availability
- Search/match: filter by language pair, level, availability overlap
- Match request + accept/decline
- Basic 1:1 messaging (text)
- Minimal admin view/dashboard (non‑reporting)

## Matching strategy (V1)
### Language levels
Level | Term | Description | Functional role in algorithm
--- | --- | --- | ---
0 | Zero | No prior knowledge. Cannot understand or speak. | Learner (can only be a target language)
1 | Beginner | Can say hello, numbers, and basic phrases. Cannot hold a conversation. | Learner (too weak to be a bridge)
2 | Elementary | Can survive travel situations (ordering food, asking directions). “Broken” but functional communication. | Weak bridge (allowed only if rules are relaxed)
3 | Intermediate | Conversational. Can explain ideas and understand explanations, even with grammar mistakes. | Strong bridge (minimum for V1)
4 | Advanced | Fluent. Can express complex thoughts and nuance effortlessly. Rare mistakes. | Teacher (qualified to help others)
5 | Native | Native or bilingual proficiency. Intuitive grasp of the language. | Teacher (qualified to help others)

> Optional mapping note: 0–1: Pre‑A1/A1, 2: A2, 3: B1/B2, 4: C1, 5: C2/Native.

### Core language buckets (internal)
> These buckets are **internal to the matching algorithm**. Users only add languages and select levels (optionally add a short self‑description).
- **Teachable (`L_teach`)**: languages where level **≥ 4 (Advanced/Native)**.
- **Learnable (`L_target`)**: languages the user **explicitly selected to practice**.
- **Bridgeable (`L_bridge`)**: languages where level **≥ 3 (Intermediate)**.

### Matching checks (V1)
A valid match exists **only if all checks pass**:
1) **Supply check** — User B has a language User A wants at **level ≥ 4**.
2) **Demand check** — User A has a language User B wants at **level ≥ 4**.
3) **Bridge check** — Users share **at least one** common language where **both** are **level ≥ 3**.

> Notes
> - V1 is **mutual-only** (no one‑sided “just chat” matches).
> - For now, we only allow **strong matches** (strict supply/demand thresholds). We may relax these thresholds later.
> - Multi‑user/group matching is out of scope for V1.

## Explicitly out‑of‑scope (V1)
- Payments or premium tiers
- Video/voice calls
- Group lessons or communities
- AI tutor features
- Full scheduling/Calendar sync
- Reporting/abuse workflows (no report in V1)

## Happy path (Mermaid)
```mermaid
flowchart TD
  A[Sign up] --> B[Create Profile]
  B --> C[Set Goals + Availability]
  C --> D[Search/Match]
  D --> E[View Candidate]
  E --> F[Send Request]
  F --> G[Accepted]
  G --> H[Chat + Plan Session]
```

## Additional confirmed requirements
- **Day‑1 multi‑language support** for all UI and user‑facing API messages (user‑selected language).
- **Profile minimums**:
  - Email (read‑only after signup)
  - Unique user handle (letters/numbers only, case‑insensitive; stored with `@` prefix, e.g., `@arturo`)
  - Languages list with levels; **at least one native language** required on registration
- **Profile edit rules**:
  - Email is read‑only after signup
  - Users can have only **one handle at a time**; handle changes must pick a handle **not currently in use by another user**
  - If a user changes handles, their old handle becomes available for others
  - Internal fixed user ID is used for interactions; `@username` is just the display label
  - Other fields editable as long as the user still has **at least one native language**
- **Additional profile fields**:
  - Birth year + month only (no date); compute age on the fly when needed
  - Store **country code**, display country name via standard mapping
  - **Avoid gender**
- **Messaging limits (anti‑spam)**:
  - Limit pre‑accept messages (N messages)
  - Daily message cap per user
  - Make both configurable

## Search filters (V1)
- Age (derived from birth year/month)
- Country (stored as country code)
- Avoid gender

## Open questions (for later phases)
- Any hard filters beyond age/country to include or avoid.
