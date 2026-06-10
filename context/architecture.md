# SetPlay — System Architecture & Decisions

This document details the architectural decisions and design specifications for **SetPlay**, finalized in June 2026.

---

## 1. Core Framework & Deployment

- **Framework**: **TanStack Start**
  - Full-stack React framework utilizing Vinxi (bundler/dev server) and Nitro (server engine).
  - Offers server-side rendering (SSR), file-based routing via TanStack Router, and colocated backend logic via Server Functions.
- **Hosting Platform**: **Cloudflare Workers**
  - The entire monolith compiles into a single Cloudflare Worker using the Nitro preset.
  - Generates zero cold starts, runs on Cloudflare's global edge network, and integrates natively with Cloudflare's serverless databases.
- **Language**: **TypeScript** (Strict mode enabled)

---

## 2. Storage & Caching Layer

- **Database**: **Cloudflare D1**
  - Serverless, distributed SQLite database at the edge.
  - Fast read/write speeds when queried directly from Cloudflare Workers due to zero network hops inside the CF network.
  - Managed using **Drizzle ORM** (type-safe schema definitions, Drizzle migrations, lightweight query client).
- **Caching**: **Cloudflare KV**
  - Key-value store used to hold temporary, high-frequency data.
  - Primarily caches the processed list of active streams (under the key `live_streams`), preventing the app from hitting Twitch or start.gg APIs on every user request.
  - Also holds the cached Twitch App Access Token with its expiration timestamp.

---

## 3. Real-Time & Polling Architecture

- **Polling Loop (Server-side)**:
  - Managed by a Cloudflare Workers **Cron Trigger** running every 60 seconds.
  - **Job 1 (Every 60s)**: Query Twitch API for live fighting game streams + start.gg API for active tournament stream queues. Run matching logic, cache result in KV.
  - **Job 2 (Every 6 hours)**: Query start.gg API for newly registered upcoming tournaments and upsert them to D1 database.
- **Frontend Updates (Client-side)**:
  - Uses **TanStack Query** (React Query) short polling.
  - The client polls the `/api/live-streams` endpoint every 30–60 seconds to pull the fresh list from Cloudflare KV.
  - Bypasses D1 queries for general visitors, saving database read quota.

---

## 4. User Experience & Features

- **Styling**: **Tailwind CSS v4** + **shadcn/ui** components (primitives copy-pasted into `src/components`).
- **Inline Embedded Player**:
  - Clicking on a stream in the dashboard loads an inline Twitch or YouTube player iFrame.
  - Includes a toggleable chat pane next to the stream.
- **Web Push Notifications**:
  - Implemented using the browser's native **Web Push API** and a custom **Service Worker**.
  - Users subscribe on a per-game or per-event basis.
  - Subscription credentials (endpoint, auth keys) are stored in D1.
  - When the cron job detects a featured event or followed game going live, it triggers a server task to broadcast push notifications via the VAPID keys.
- **Authentication**:
  - **Deferred to v2**.
  - All MVP user preferences (e.g., followed games) are stored client-side in `localStorage`.
- **Administrative Access**:
  - Protected admin routes (`/admin/*`) use a basic Token/Header authentication check.
  - A secret token is defined in Cloudflare Worker environment variables.

---

## 5. Development & Testing Workflow

- **Local Emulation**:
  - Runs using Cloudflare's **Wrangler local mode** (`wrangler dev` powered by Miniflare).
  - Emulates D1 database and KV store locally, writing to local disk and keeping development offline and fast.
- **Testing Strategy**:
  - **Vitest**: Fast, Vite-native testing framework. Focuses on unit and integration tests (stream title parser, D1 CRUD queries, cron jobs).
  - **Playwright**: End-to-End browser tests for critical paths (verifying dashboard rendering, search filters, and page navigation).
