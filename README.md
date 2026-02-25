# Amiglot UI

Frontend for Amiglot — find language learning partners.

## Tech Stack
- Next.js 16.1.6
- React 19.2.3
- TypeScript 5.x

## Prerequisites
- Node.js 20+
- An API instance reachable at the same origin under `/api/v1`

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Open `http://localhost:3000` to view the app.

## Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run start
```

## Testing
- Unit tests: `npm run test`
- Coverage run: `npm run test:coverage`
- CI runs lint, typecheck, coverage tests, and build.
