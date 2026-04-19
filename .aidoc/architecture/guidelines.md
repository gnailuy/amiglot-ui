---
domain: Architecture
status: Active
entry_points:
  - src/app/layout.tsx
dependencies:
  - .aidoc/INDEX.md
---

# Architecture & Coding Guidelines

Frontend architecture and coding standards for Amiglot UI. Single source of truth for all UI architectural decisions.

## Related Docs

| Document | Relationship |
|----------|-------------|
| [Technical Specification](../designs/technical-specification.md) | Shared UI ↔ API contract |
| [Discovery Dashboard](../designs/discovery-dashboard.md) | Dashboard component design |
| [Connection Handshake](../designs/connection-handshake.md) | Connection UI design |

## Why These Standards Exist

Consistency across contributors and AI agents. Prevents "God Components" where data fetching, state, validation, and rendering are mixed in a single file.

## Technical Stack

- Next.js 16.1.6, React 19.2.3, TypeScript 5.x
- ESLint + Prettier with strict lint/typecheck/build in CI

## Architectural Philosophy

- **Separation of Concerns:** Never mix data fetching, state management, validation, and rendering in one file.
- **Server-First:** Default to Server Components via App Router. Only use `"use client"` when interactivity or browser APIs are required.

## Component Structure

| File | Role | Rules |
|------|------|-------|
| `page.tsx` | Server Component entry point | No `useState`/`useEffect`. Fetch data, pass as `initialData` prop. |
| `[feature]-form.tsx` | Client Component container | `"use client"` directive. Receives `initialData`, manages form state, handles `onSubmit`. |
| `schema.ts` | Validation source of truth | Export Zod schemas. No inline validation in components. |
| Sub-components | UI blocks | Extract when `return` exceeds 100 lines. |

## Form & State Management

- **Standard:** React Hook Form + Zod (`@hookform/resolvers/zod`).
- Define shapes and error messages in Zod schemas, pass resolver to `useForm`.
- No dozens of individual `useState` hooks for form fields.
- Dynamic lists (languages, time slots): use `useFieldArray`.

## UI & Styling

- **Tailwind CSS + shadcn/ui.** Use `cn()` for conditional classes.
- No custom CSS or inline styles unless absolutely necessary.
- `<select>` with >10 options: use shadcn/ui Combobox (Command) pattern.

## Internationalization (i18n)

- **next-intl.** No hardcoded user-facing strings.
- Always use `useTranslations()` hook with semantic keys (e.g., `t('auth.login.submitButton')`).
- Global datasets (language codes, timezones): prefer browser `Intl` APIs with fallback data.

## Loading & Disabled States

Every component depending on backend data MUST show loading indicators until data arrives:
- **Buttons triggering API calls:** disabled during initial load and in-flight requests
- **Lists/content areas:** skeleton placeholders while fetching
- **Forms:** submit button disabled until API call completes
