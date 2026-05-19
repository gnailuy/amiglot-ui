---
domain: Conventions
status: Active
entry_points: []
dependencies: []
---

# Amiglot UI — Documentation Index

Discovery index for all project documentation. See reading chains below for guided paths.

## Architecture

| Document | Description |
|----------|-------------|
| [architecture/guidelines.md](architecture/guidelines.md) | Frontend architecture, coding standards, component structure |

## Designs

| Document | Description |
|----------|-------------|
| [designs/product-definition.md](designs/product-definition.md) | Product scope, personas, matching strategy, V1 requirements |
| [designs/product-specification.md](designs/product-specification.md) | User stories and action paths |
| [designs/technical-specification.md](designs/technical-specification.md) | Shared UI ↔ API contract |
| [designs/discovery-dashboard.md](designs/discovery-dashboard.md) | Discovery dashboard UI design |
| [designs/connection-handshake.md](designs/connection-handshake.md) | Connection request UI and messaging |
| [designs/in-app-messaging.md](designs/in-app-messaging.md) | Conversations hub and chat interface for matched partners |

## Workflows

| Document | Description |
|----------|-------------|
| [workflows/unit-test-plan.md](workflows/unit-test-plan.md) | Unit test baseline and coverage priorities |
| [workflows/e2e-test-plan.md](workflows/e2e-test-plan.md) | End-to-end test plan with Playwright |

## Cross-Repo References (amiglot-api)

Amiglot UI and API are closely connected. The API repo (`gnailuy/amiglot-api`) has its own `.aidoc/` with complementary docs:

| UI Doc | API Counterpart | Relationship |
|--------|----------------|---------------|
| [Technical Specification](designs/technical-specification.md) | [API Contract](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/api-contract.md) | Shared endpoint contract — UI defines the client side, API defines the server side |
| [Discovery Dashboard](designs/discovery-dashboard.md) | [Discovery Matching](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/discovery-matching.md) | UI dashboard ↔ API matching rules that power it |
| [Connection Handshake](designs/connection-handshake.md) | [Connection Handshake](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/connection-handshake.md) | UI flows and components ↔ API state machine |
| [In-App Messaging](designs/in-app-messaging.md) | [In-App Messaging](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/in-app-messaging.md) | UI conversations and chat ↔ API messaging endpoints |
| [E2E Test Plan](workflows/e2e-test-plan.md) | [E2E Test Plan](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/workflows/e2e-test-plan.md) | Playwright browser tests ↔ Server-side test scenarios |
| [Architecture Guidelines](architecture/guidelines.md) | [Architecture Guidelines](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/architecture/guidelines.md) | Frontend conventions ↔ Backend conventions |
| — | [Database Schema](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/database-schema.md) | Tables, constraints, and migrations (API repo is the source of truth) |
| — | [Matching Query](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/discovery-matching-query.md) | SQL CTE and index strategy for discovery matching |

## Reading Chains

### New Developer
1. [Architecture Guidelines](architecture/guidelines.md) — component structure and conventions
2. [Product Definition](designs/product-definition.md) — what Amiglot is and V1 scope
3. [Technical Specification](designs/technical-specification.md) — API contract
4. [Unit Test Plan](workflows/unit-test-plan.md) — testing approach

### Feature Work (Discovery)
1. [Product Definition](designs/product-definition.md) — matching rules
2. [Discovery Dashboard](designs/discovery-dashboard.md) — UI design
3. [Technical Specification](designs/technical-specification.md) — discovery endpoint
4. [E2E Test Plan](workflows/e2e-test-plan.md) — dashboard test groups

### Feature Work (Connection)
1. [Connection Handshake](designs/connection-handshake.md) — UI and state management
2. [Technical Specification](designs/technical-specification.md) — connection endpoints
3. [E2E Test Plan](workflows/e2e-test-plan.md) — connection test groups

### Feature Work (In-App Messaging)
1. [In-App Messaging](designs/in-app-messaging.md) — conversations hub and chat interface
2. [Connection Handshake](designs/connection-handshake.md) — accept flow that creates matches
3. [Technical Specification](designs/technical-specification.md) — messaging endpoints
4. [E2E Test Plan](workflows/e2e-test-plan.md) — messaging test groups

### Product Context
1. [Product Definition](designs/product-definition.md) — scope and personas
2. [Product Specification](designs/product-specification.md) — user stories and flows

### Cross-Repo: Full-Stack Feature Understanding
1. [Product Definition](designs/product-definition.md) — what Amiglot is
2. [Architecture Guidelines](architecture/guidelines.md) — Frontend conventions
3. [Architecture Guidelines (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/architecture/guidelines.md) — Backend conventions
4. [Technical Specification](designs/technical-specification.md) + [API Contract (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/api-contract.md) — shared contract
5. [Discovery Dashboard](designs/discovery-dashboard.md) + [Discovery Matching (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/discovery-matching.md) — full-stack discovery
6. [Connection Handshake](designs/connection-handshake.md) + [Connection Handshake (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/connection-handshake.md) — full-stack connection
7. [In-App Messaging](designs/in-app-messaging.md) + [In-App Messaging (API)](https://github.com/gnailuy/amiglot-api/blob/main/.aidoc/designs/in-app-messaging.md) — full-stack messaging
