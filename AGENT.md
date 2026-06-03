# AGENT.md — Amiglot UI

Instructions for AI agents working on this repo.

## Documentation

Read `.aidoc/INDEX.md` first. It has a discovery table and reading chains — follow the chain that matches your task.

The backend repo ([amiglot-api](https://github.com/gnailuy/amiglot-api)) has its own `.aidoc/` with complementary docs. Cross-repo references in `.aidoc/INDEX.md` link to the counterpart docs.

## Development workflow

- Branch from `main`: `feature/<short>` for features, `fix/<short>` for fixes.
- PRs target `main`. Include both docs and implementation in the same PR.
- CI must pass before merge: `npm run lint` (zero warnings), `npm run typecheck`, `npm run test`, `npm run build`.

## Documentation as development

When adding or changing features, update `.aidoc/` docs as part of the same PR. Follow the doc-manager skill and DocGuidelines:

- Docs capture the *why* and *constraints*. Code is the *how*.
- Create or update the relevant design doc in `.aidoc/designs/`.
- Update `.aidoc/INDEX.md`: add table entries and update reading chains.
- Keep docs ~100 lines. Split by subdomain rather than writing monoliths.

## Domain placeholder

Use `example.com` as the placeholder domain in all code, docs, and tests.

## Internationalization

All user-facing strings must use `next-intl` with semantic keys. No hardcoded strings. All 11 locale files must be updated together.
