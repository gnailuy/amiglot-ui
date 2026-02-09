# Amiglot — Production Definition (Phase 1)

## Personas
1) **Serious Learner** — wants consistent practice, structured goals, prefers matched levels.
2) **Casual Partner** — wants light conversation practice, flexible schedule.
3) **Helper/Tutor‑leaning** — enjoys teaching, may prefer advanced learners or specific languages.

## Top 3 user journeys
A) **Onboarding → Profile → Language goals → Availability → Match preferences → Start searching**
B) **Discover/match → Browse candidates → Send request → Accept → Open chat**
C) **Chat → Schedule practice → Keep notes → Continue/adjust**

## V1 must‑have
- Auth/session: **magic link** (dev mode: if `ENV=dev` and no sender, generate login link locally)
- Profile: native + target languages, level, goals, time zone, availability
- Search/match: filter by language pair, level, availability overlap
- Match request + accept/decline
- Basic 1:1 messaging (text)
- Safety: report/block + basic moderation queue
- Simple admin view for reports (minimal OK)

## Explicitly out‑of‑scope (V1)
- Payments or premium tiers
- Video/voice calls
- Group lessons or communities
- AI tutor features
- Full scheduling/Calendar sync

## Happy path (ASCII flow)
```
[Sign up]
   |
[Create Profile] -> [Set Goals + Availability]
   |
[Search/Match] -> [View Candidate]
   |
[Send Request] -> [Accepted]
   |
[Chat + Plan Session]
```

## Additional confirmed requirements
- **Day‑1 multi‑language support** for all UI and user‑facing API messages (user‑selected language).
- **Profile minimums**:
  - Email
  - Unique user handle (letters/numbers only, case‑insensitive; stored with `@` prefix, e.g., `@arturo`)
  - Languages list with levels; **at least one native language** required on registration
- **Additional profile fields**:
  - Birth year + month only (no date); compute age on the fly when needed
  - Store **country code**, display country name via standard mapping
  - **Avoid gender**

## Search filters (V1)
- Age (derived from birth year/month)
- Country (stored as country code)
- Avoid gender

## Gitflow note
- PRs required by default; target branch: `main`
- Branch naming: `feature/<short>` and `fix/<short>`

## Open questions (for later phases)
- Clarify “reports” taxonomy (e.g., user safety, abuse, content) and notification strategy.
- Minimum required profile fields beyond the confirmed set.
- Any hard filters beyond age/country to include or avoid.
