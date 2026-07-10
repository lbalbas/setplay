# Code Standards

## General

- Keep modules small, focused, and single-purpose.
- Fix root causes — do not layer workarounds or patch superficial issues.
- Maintain clear boundaries between server runtime logic, client view presentation, and data schema definitions.

## TypeScript

- **Strict Mode**: Required throughout the codebase. No compiler warnings or errors allowed.
- **Type Casting**: Avoid `any` or explicit casting (`as SomeType`) unless dealing with third-party libraries that lack complete typing. Use `unknown` and runtime assertions where appropriate.
- **Input Validation**: Validate all external inputs (e.g., start.gg responses, Twitch payloads, environment variables, API request bodies) at system boundaries using **Zod** schemas before processing or persisting.

## TanStack Start

- **Hybrid Communication Model**:
  - **Server Functions (`createServerFn`)**: Use for RPC-style client-server operations where type safety is paramount (e.g., subscribing to notifications, adding interest, updating user preferences). Validate input shapes natively via Zod by chaining `.validator(zodSchema)` to the function definition.
  - **Server Routes (API Endpoints under `src/routes/api/`)**: Use specifically for high-read polling endpoints (like `/api/live-streams` caching KV reads) or Webhook/Cron target callbacks (like `/api/cron` triggers) that require clean REST paths and custom `Cache-Control` header declarations.
- **Client Components**: Mark components with `"use client"` only when they use React state, hooks, browser-specific APIs (like `localStorage` or push registration), or real-time event clients.

## Drizzle ORM & Database

- Maintain schema definitions in `src/server/db/schema.ts`.
- Export inferred types for Drizzle models (`Game`, `Event`, etc.) at the bottom of the schema file.
- Keep queries inside isolated helper modules in `src/server/` or Server Functions; do not write inline raw queries within client UI components.
- Run migrations via `drizzle-kit` and commit migration SQL files to the repository.

## Styling

- *Postponed / TBD* (All styling rules will be documented here once the UI decisions are finalized).

## File Organization

- `src/routes/` — Route-based layouts, pages, and REST API endpoints.
- `src/components/` — General React UI components. Do not put business logic here.
- `src/server/db/` — Database schemas, connections, and migrations.
- `src/server/` — Background tasks, cron jobs, matching algorithms, and API integrations.
- `tests/` — Separated into `unit/` (Vitest for business logic) and `e2e/` (Playwright for user flow verification).
