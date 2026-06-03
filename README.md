# Amiglot UI

Frontend for Amiglot — a site to find language learning partners.

## Features

- Magic-link authentication flow
- Profile setup with language selection, levels, and availability
- Discovery dashboard with match cards and language-pair scoring
- Connection requests with messaging dialog
- Conversations hub and chat interface for matched partners
- Full internationalization (11 locales)

## Documentation

Project documentation lives in `.aidoc/` and follows AI-native conventions. Start with [`.aidoc/INDEX.md`](.aidoc/INDEX.md) for architecture, designs, and workflows.

The backend lives in a separate repo: [amiglot-api](https://github.com/gnailuy/amiglot-api). Both repos cross-reference each other's `.aidoc/` docs.

## Stack

- Next.js 16, React 19, TypeScript 5
- Tailwind CSS + shadcn/ui
- next-intl for i18n

## Setup

```bash
npm install
cp .env.example .env.local
```

Key variables: `NEXT_PUBLIC_API_URL` (API base URL), `NEXT_PUBLIC_APP_URL` (UI base URL).

## Development

```bash
npm run dev
```

Open `http://localhost:3000`.

## Tests

```bash
npm run lint        # ESLint (zero warnings)
npm run typecheck   # TypeScript
npm run test        # Vitest
npm run build       # Production build
```

CI runs all four.
