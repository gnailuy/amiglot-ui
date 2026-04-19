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

## Workflows

| Document | Description |
|----------|-------------|
| [workflows/unit-test-plan.md](workflows/unit-test-plan.md) | Unit test baseline and coverage priorities |
| [workflows/e2e-test-plan.md](workflows/e2e-test-plan.md) | End-to-end test plan with Playwright |

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

### Product Context
1. [Product Definition](designs/product-definition.md) — scope and personas
2. [Product Specification](designs/product-specification.md) — user stories and flows
