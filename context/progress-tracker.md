# Progress Tracker

## Current Phase

- **Phase 2: Database, Backend Ingestion & Live Services**

## Current Goal

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
- **KV-Cached API Endpoint (`/api/live-streams`)**: Implemented public server route endpoint in `src/routes/api/live-streams.ts` that retrieves matched live stream data directly from Cloudflare KV, returns JSON with custom `Cache-Control` / `CDN-Cache-Control` edge headers, safely handles corrupted JSON fallbacks, and wired Cloudflare environment context passing through `app.fetch` in `src/server/index.ts`. Tested and verified with local cron worker trigger.
- **Cloudflare Vite Dev Integration & HMR**: Configured `@cloudflare/vite-plugin` in `vite.config.ts` and created `src/server/env.ts` helper so server functions and API routes access Cloudflare bindings (D1, KV) during standard `pnpm dev` with full instant React HMR. Created isolated `vitest.config.ts` for unit test stability.
- **Twitch Thumbnail Formatting**: Implemented `src/utils/formatThumbnail.ts` helper and wired standard dimensions (`640x360` for `StreamCard`, `1280x720` for `FeaturedHero`) replacing Twitch `{width}x{height}` template placeholders.
- **FGC Game IDs & Seed Data Correction**: Verified and populated fighting game IDs and metadata in `src/server/db/seed.sql` with verified Twitch Helix Game IDs and start.gg Videogame IDs (SF6, Tekken 8, GG Strive, DBFZ, SSBU, SSBM, UNI2, MK1, COTW, MVCC, Marvel Tokon, Avatar Legends, GBVS Rising, GG +R, GG Xrd REV 2, BlazBlue Centralfiction, 2XKO, Melty Blood Type Lumina, and Melty Blood AACC).
- **Database Game Filter Integration**: Hooked up `getGames` in `src/routes/__root.tsx` loader to supply live database game entities to `GameFilterBar` and `StreamGrid`, replacing `MOCK_GAMES` and enabling real Twitch game ID / slug matching across stream lists.
- **GameFilterBar UI Refinement**: Refactored `GameFilterBar` to show "All" + top 4 featured games as pills with a clean "+ More (N)" dropdown menu for remaining games, with click-outside detection and active filter highlighting.
- **Frontend Live Data Integration**: Connecting `/api/live-streams` polling to frontend components (`StreamGrid`, `FeaturedHero`, `CalendarSidebar`) to replace mock stream data.
- **Service Worker & Event Push Notifications**: Implemented `public/sw.js` for background alert handling and window navigation, `src/server/push.ts` for VAPID notification dispatching and dead endpoint pruning (Invariant #4), `src/server/subscriptions.ts` server functions for subscription and interest management, `src/hooks/useEventPushSubscription.ts` and `src/utils/push.ts` for client registration and local state syncing, interactive Bell notification toggles on tournament cards in `src/routes/events.tsx`, and automatic event alert dispatching in the 60-second cron matching routine (`src/server/cron.ts`). Tested and verified via Vitest.
- **Event Calendar Scoping & Status Filtering**: Updated `/events` directory to hide completed tournaments by default under a new "Upcoming & Live" default filter state with reverse chronological sorting for completed events, bounded the start.gg API calendar sync query to 12 months ahead with cutoff filtering, constrained D1 `getEvents` queries to a rolling window (past 30 days to next 12 months), and added periodic maintenance in `cron.ts` to prune completed events older than 90 days and far-future duds.
- **Unified Background Cron Logging in KV**: Implemented structured, non-overwriting logging buffer (`cron_logs` in Cloudflare KV) across both `run60sStreamMatching` and `run6HourCalendarSync` with unique IDs, error string extraction, and a 250-entry rolling window via `finally` flush.
- **Admin Dashboard Live Logs Integration**: Connected `getLogs` server function to read KV `cron_logs`, wired parallel route loader in `/admin` with `Promise.all([getEvents(), getLogs()])`, added 15-second background polling via TanStack Query when the "Cron Logs" tab is active, and rendered live timestamped entries with status badges.
- **Admin Navigation Guard in Header**: Conditionally rendered `/admin` navigation link in `Header.tsx` based on `auth.isAuthenticated` resolved from `getRouteApi('__root__').useRouteContext()`.
- **Phase 1 Fixes & Codebase Cleanup**: Resolved `activeTab` Temporal Dead Zone runtime crash in `src/routes/admin.tsx`, linked `FeaturedHero` CTA to the dynamic watch route, fixed `EventWithGames` import in `EventCalendar`, strictly typed `placeholderData` in `useLiveStreams`, and added missing `bracketUrl` fixture properties to `matching.test.ts`. Formatted codebase with `oxfmt`.
- **Dynamic Watch Stream Resolution (Phase 2 part 1)**: Integrated `useLiveStreams` hook into `src/routes/watch.$streamName.tsx` via memoized `resolveStream` utility, supporting both Twitch usernames (`streamName`) and stream IDs (`id`) from KV live streams with fallback to offline/mock data, and handled live connecting/offline UI states.
- **Admin In-Place Gate & Session Management**: Implemented `loginAdmin` and `logoutAdmin` server functions in `src/server/auth.ts` with `HttpOnly` cookie generation. Replaced unconditional `/admin` redirect with a sleek in-place `AdminGate` component, protecting sensitive logs/events from loading when unauthenticated and triggering client-side `router.invalidate()` upon successful authorization. Added dashboard "Lock" button.
- **Admin Security & Overrides**: Secured `/admin` with `ADMIN_TOKEN` verification and connected manual override forms to D1/KV. Refactored `overrides.ts` with Zod schema validation boundaries (`getOverridesFromKV`), single-query D1 resolution, symmetric priority weighting (`PRIORITY_WEIGHT`), and headline demotion ordering.
- **Admin Dashboard Integration & Controls (`admin.tsx`)**: Wired working "Sync Streams" trigger via server function, added inline "Reset" / "Remove Override" actions in table and sidebar, dynamically computed "Last Sync" relative timestamp from KV logs, handled empty stream cache states, and eliminated `any` types.
- **Cron Job Optimization & Maintenance Resilience (`cron.ts`)**: Batched `eventGames` D1 inserts in chunks of 50 to eliminate N+1 round trips, wrapped individual Web Push dispatches in isolated try/catch blocks to protect stream cache updates, added 300s expiration TTL to live streams KV cache, and cleaned up orphaned polymorphic `subscriptionInterests` rows on event pruning.
- **Unit Test Suite Expansion**: Expanded unit test coverage from 21 to 44 tests across 8 test suites, adding new suites for `overrides.test.ts` (Zod schemas, KV parsing fallback, priority weighting), `auth.test.ts` (token schemas, Bearer/cookie extraction), and `watchResolve.test.ts` (live stream resolving, case-insensitivity, mock fallback), plus priority sorting tests in `matching.test.ts`.
- **Theater Mode View**: Implemented responsive theater mode for stream watch experience with full viewport height layout, top bar toggle, and 't' key shortcut.
- **Playwright E2E Test Suite**: Implemented comprehensive end-to-end verification suite comprising 33 tests across 7 specification files (`01-navigation-shell.spec.ts`, `02-dashboard-streams.spec.ts`, `03-calendar-sidebar.spec.ts`, `04-events-directory.spec.ts`, `05-watch-experience.spec.ts`, `06-admin-portal.spec.ts`, `07-api-integration.spec.ts`), with shared fixtures in `tests/e2e/fixtures.ts`. Configured `playwright.config.ts` and `vitest.config.ts` for clean test isolation and controlled concurrency. All 33 E2E tests and 44 unit tests pass 100%.
- **Project Documentation & README Overhaul**: Replaced the default boilerplate README with a production-grade documentation guide detailing the FGC problem space, 4-layer matching engine, edge-first architecture (Cloudflare Workers, D1, KV), system invariants, Mermaid system architecture diagram, tech stack breakdown, project tree, local development setup, testing suites (unit & E2E), and design system tokens.
- **KV Quota Optimization & 3-Minute Cron Transition**: Migrated high-frequency stream matching cron trigger from every 60s (`* * * * *`) to every 3 minutes (`*/3 * * * *`) in `wrangler.toml` and `src/server/cron.ts`. This reduces daily KV writes from ~1,440/day down to ~480/day (consuming only 48% of Cloudflare KV's 1,000 free-tier daily write limit). Increased KV `live_streams` cache `expirationTtl` from 300s to 600s to guard against cache eviction across intervals. Added backward-compatible aliases and updated architecture documentation.

## In Progress


## Next Up

- MVP Polish & Production Deployment Preparation.

## Open Questions

- _None at this time._

## Architecture Decisions

- **Unified Worker Monolith**: Decided to build the entire app (SSR router, API routes, and Cron Jobs) inside a single Cloudflare Worker.
- **Hybrid Communication**: Server Functions are preferred for user-triggered mutations, and Server Routes (API endpoints) are preferred for high-frequency polling (`/api/live-streams`) and cron jobs.
- **Privacy-First Personalization**: Deferred authentication to v2. User preferences are stored in the browser's `localStorage` for the MVP.
- **Hot Caching**: Live streams are cached as a static JSON array inside Cloudflare KV to insulate the D1 database from hot-path read requests.
- **Unified Stream Feed**: Show both matched tournament streams and casual streams in the feed, with tournaments having primary focus, to improve FGC stream discovery. Both stream types are captured in the cron worker and cached in the same KV payload.
- **Obsidian & Neon Yellow Theme**: Finalized a locked dark-mode design system utilizing a near-black warm obsidian background (`#0A0A08`), warm charcoal surfaces (`#141411`), and neon yellow (`#FFF282`) as a focused accent color (5-10% visual prominence) for interactive elements and live indicators.
