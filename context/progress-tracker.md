# Progress Tracker

## Current Phase

- **Phase 2: Database, Backend Ingestion & Live Services**

## Current Goal

- Implement full cron ingestion loop in `src/server/cron.ts` and public KV-cached endpoint `/api/live-streams`.

## Completed

- **Project Scaffolding**: Initialized TanStack Start with Vite, TypeScript, and Tailwind CSS v4.
- **Database Schema**: Structured D1 SQLite tables (`games`, `events`, `event_games`, `push_subscriptions`, `subscription_interests`) inside `src/server/db/schema.ts`.
- **Wrangler Bindings**: Configured D1 database and KV namespaces inside `wrangler.toml`.
- **Core Layout Shell**: Created `src/routes/__root.tsx`, `Header.tsx`, `Footer.tsx`, and `ThemeToggle.tsx` with initial styling.
- **Context Definition**: Created and finalized all SetPlay developer guidelines and system specifications (`project-overview.md`, `architecture-context.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`, `AGENTS.md`).
- **Dependencies Setup**: Installed `zod` for type-safe validation boundaries.
- **pnpm v11 Migration**: Migrated `pnpm.onlyBuiltDependencies` from `package.json` to `allowBuilds` in `pnpm-workspace.yaml` for pnpm 11 compatibility.
- **CSS Theme Variables**: Setting up the Obsidian & Neon Yellow palette inside `src/styles.css` using Tailwind v4 custom theme mappings.
- **Mock Data Setup**: Create a comprehensive mock data set for games, active events, tournament streams, and casual streams.
- **UI Component Assembly**: Implement the main layout components (`FeaturedHero`, `StreamGrid`, `CalendarSidebar`, and updated `Header`/`Footer` navigation) styled strictly in the Obsidian-yellow theme.
- **UI Refactoring Complete**: Refactored Header navbar, GameFilterBar position, StreamGrid stream type filters, section separators (`🏆 PINNED TOURNAMENTS` badge line and `ALL STREAMS` line), and stream card styling on branch `feature/game-filter-and-stream-grid-refactor`.
- **Accessibility & HTML Semantics Audit**: Audited HTML tags, improved semantics (description lists for data grids, button elements for filters) and added ARIA attributes for screen readers across the frontend layout.
- **Events Directory (Mock)**: Implemented the `/events` page layout (`src/routes/events.tsx`) with location/status filters and responsive list view using mock data.
- **Admin Dashboard UI (Mock)**: Implemented the full admin dashboard page (`src/routes/admin.tsx`) with Stream Management table, "Link Stream to Event" sidebar panel, and Cron Logs tab. Uses local state and inline mock data; no API integration yet.
- **Watch View (`/watch/$streamName`)**: Implemented the watch route (`src/routes/watch.$streamName.tsx`) with dynamic path params (e.g. `/watch/str_1`, `/watch/evo-sf6-finals`), responsive split-screen layout, simulated video player, theater mode toggle, live chat panel toggle and interactive input, stream metadata card linked to start.gg brackets, and accessible Web Push notifications toggle switch. Route `/watch` automatically redirects to the headline stream.
- **LocalStorage Preferences (Basic)**: Persisted selected game filter in `localStorage` through `GameFilterContext`.
- **Database Migrations & Seeding**: Generated D1 SQLite migration files via `drizzle-kit generate`, configured `wrangler.toml` migration directory, created initial FGC games `seed.sql`, and verified local D1 database execution.
- **Twitch Helix API Integration**: Built `src/server/twitch.ts` with Zod validation schemas, OAuth Client Credentials token caching in Cloudflare KV, and `fetchLiveStreamsByGame` client. Connected `cron.ts` worker to query D1 tracked games and persist live stream data into KV.
- **start.gg GraphQL Integration**: Built `src/server/startgg.ts` with Zod validation schemas, `fetchActiveStreamQueues` for stream queue matching, and `fetchUpcomingTournaments` for 6-hour D1 calendar sync.
- **4-Layer Stream Matching Engine**: Implemented `src/server/matching.ts` with start.gg Stream Queue (Layer 1), Known Channel Registry (Layer 2), Stream Title Regex & Stage Matching (Layer 3), and Casual Discovery Fallback (Layer 4), plus confidence-based and viewer-based stream ordering. Tested via Vitest suite.
- **Cron Jobs Separation & Ingestion Routines**: Separated the 60-second stream matching job (`run60sStreamMatching`) from the 6-hour calendar sync job (`run6HourCalendarSync`) in `src/server/cron.ts`. Implemented 6-hour start.gg ingestion to query upcoming tournaments, upsert metadata into D1 (`events`), link game relations (`event_games`), and execute subscription maintenance. Configured dual cron triggers (`* * * * *` and `0 */6 * * *`) in `wrangler.toml`.

## In Progress

- **API Endpoint & Integration**: Exposing `/api/live-streams` endpoint and connecting live KV stream cache to frontend components.

## Next Up

1. **KV Cache API & Integration**:
   - Implement public cached endpoint `/api/live-streams` reading directly from KV.
3. **Web Push Notifications**:
   - Implement service worker (`public/sw.js`) and VAPID dispatcher (`src/server/push.ts`).
   - Implement `createServerFn` mutations to register subscriptions and update interest mapping.
4. **Frontend Live Data Integration & Admin Security**:
   - Replace mock data in `StreamGrid`, `FeaturedHero`, and `EventCalendar` with live KV cache reads and server loaders.
   - Secure `/admin` with `ADMIN_TOKEN` verification and connect manual override forms to D1/KV.
   - Add Playwright E2E verification test suite.

## Open Questions

- _None at this time._

## Architecture Decisions

- **Unified Worker Monolith**: Decided to build the entire app (SSR router, API routes, and Cron Jobs) inside a single Cloudflare Worker.
- **Hybrid Communication**: Server Functions are preferred for user-triggered mutations, and Server Routes (API endpoints) are preferred for high-frequency polling (`/api/live-streams`) and cron jobs.
- **Privacy-First Personalization**: Deferred authentication to v2. User preferences are stored in the browser's `localStorage` for the MVP.
- **Hot Caching**: Live streams are cached as a static JSON array inside Cloudflare KV to insulate the D1 database from hot-path read requests.
- **Unified Stream Feed**: Show both matched tournament streams and casual streams in the feed, with tournaments having primary focus, to improve FGC stream discovery. Both stream types are captured in the cron worker and cached in the same KV payload.
- **Obsidian & Neon Yellow Theme**: Finalized a locked dark-mode design system utilizing a near-black warm obsidian background (`#0A0A08`), warm charcoal surfaces (`#141411`), and neon yellow (`#FFF282`) as a focused accent color (5-10% visual prominence) for interactive elements and live indicators.
