# Progress Tracker

## Current Phase

- **Phase 1: Context, Design System & Frontend Setup**

## Current Goal

- Establish theme variables and build frontend components with high-fidelity mock data before wiring up Drizzle migrations and backend emulation.

## Completed

- **Project Scaffolding**: Initialized TanStack Start with Vite, TypeScript, and Tailwind CSS v4.
- **Database Schema**: Structured D1 SQLite tables (`games`, `events`, `event_games`, `push_subscriptions`, `subscription_interests`) inside `src/server/db/schema.ts`.
- **Wrangler Bindings**: Configured D1 database and KV namespaces inside `wrangler.toml`.
- **Core Layout Shell**: Created `src/routes/__root.tsx`, `Header.tsx`, `Footer.tsx`, and `ThemeToggle.tsx` with initial styling.
- **Context Definition**: Created and finalized all SetPlay developer guidelines and system specifications (`project-overview.md`, `architecture-context.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`, `AGENTS.md`).
- **Dependencies Setup**: Installed `zod` for type-safe validation boundaries.

## In Progress

- **CSS Theme Variables**: Setting up the Obsidian & Neon Yellow palette inside `src/styles.css` using Tailwind v4 custom theme mappings.

## Next Up

- **Mock Data Setup**: Create a comprehensive mock data set for games, active events, tournament streams, and casual streams.
- **UI Component Assembly**: Implement the main layout components (`FeaturedHero`, `StreamGrid`, `CalendarSidebar`, and updated `Header`/`Footer` navigation) styled strictly in the Obsidian-yellow theme.
- **Database Migrations & Emulation**: Set up Drizzle migration workflows and verify wrangler local emulation (`wrangler dev` with D1 and KV).
- **Backend Integrations**: Build the Twitch Helix and start.gg API handlers and the 4-layer matching worker.

## Open Questions

- *None at this time.*

## Architecture Decisions

- **Unified Worker Monolith**: Decided to build the entire app (SSR router, API routes, and Cron Jobs) inside a single Cloudflare Worker.
- **Hybrid Communication**: Server Functions are preferred for user-triggered mutations, and Server Routes (API endpoints) are preferred for high-frequency polling (`/api/live-streams`) and cron jobs.
- **Privacy-First Personalization**: Deferred authentication to v2. User preferences are stored in the browser's `localStorage` for the MVP.
- **Hot Caching**: Live streams are cached as a static JSON array inside Cloudflare KV to insulate the D1 database from hot-path read requests.
- **Unified Stream Feed**: Show both matched tournament streams and casual streams in the feed, with tournaments having primary focus, to improve FGC stream discovery. Both stream types are captured in the cron worker and cached in the same KV payload.
- **Obsidian & Neon Yellow Theme**: Finalized a locked dark-mode design system utilizing a near-black warm obsidian background (`#0A0A08`), warm charcoal surfaces (`#141411`), and neon yellow (`#FFF282`) as a focused accent color (5-10% visual prominence) for interactive elements and live indicators.
