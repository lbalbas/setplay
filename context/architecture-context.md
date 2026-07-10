# Architecture Context

## Stack

| Layer             | Technology                 | Role                                                               |
| ----------------- | -------------------------- | ------------------------------------------------------------------ |
| Framework         | TanStack Start + TypeScript| Full-stack React app with server/client boundaries and Vinxi/Nitro |
| UI & Styling      | Tailwind CSS v4            | Responsive interface and theme tokens                              |
| Database          | Drizzle ORM + Cloudflare D1| Relational SQLite database for games, events, and push credentials |
| Transient Caching | Cloudflare KV              | Hot caching of live stream list and Twitch authorization tokens    |
| Cron Triggers     | Cloudflare Worker Crons    | Recurring background API ingestion and stream matching jobs        |
| Push Services     | Web Push API               | VAPID-based browser alerts dispatched from serverless worker       |

## System Boundaries

- `src/routes` — Pages and Server Routes. Includes type-safe frontend routes and API endpoints (e.g., `/api/live-streams`, `/api/cron`).
- `src/components` — Reusable React components (theme toggle, player shell, stream lists).
- `src/server/db` — Drizzle schema models, type helpers, and DB client connection builder.
- `src/server/matching.ts` — The 4-layer stream-to-tournament matching algorithm.
- `src/server/cron.ts` — Background worker routines triggered by the Cloudflare Cron Scheduler.
- `src/server/push.ts` — Web Push client dispatcher using VAPID keys.

## Storage Model

- **Database (Cloudflare D1)**: Relational schema storing:
  - Games supported by the platform (`games`).
  - Active, upcoming, and completed events (`events`).
  - Tournament-game relations (`event_games`).
  - Active push subscriptions (`push_subscriptions` / `subscription_interests`).
- **Cache (Cloudflare KV)**: Transient high-read or ephemeral key-value data:
  - `live_streams`: Cached JSON array of matched active streams. Used by the main frontend.
  - `twitch_token`: Ephemeral Twitch API access token and expiry time.
- **Client Storage (LocalStorage)**:
  - Storing user preferences (`followed_games`, `followed_events`, `theme`).

## Polling & Cron Architecture

- **Job 1 (Every 60s)**:
  - Query Twitch Helix API for live streams in registered game categories.
  - Query start.gg alpha GraphQL API for current stream queues in ongoing tournaments.
  - Run the 4-layer matching algorithm (`matching.ts`) to pair active broadcasts with active events. Streams that do not match are categorized as general/casual streams.
  - Write the final prioritized list of matched and casual streams to Cloudflare KV (`live_streams`).
- **Job 2 (Every 6 hours)**:
  - Query start.gg for new/upcoming tournaments featuring the registered fighting games.
  - Upsert upcoming tournament metadata to D1 (`events`, `event_games`).
  - Clean up expired push subscriptions.

## Security & Admin Access

- User authentication is deferred; user preferences are completely local.
- The UI is locked to dark-mode only. No light-mode toggle is provided.
- Administrative routes (`/admin/*`) are protected by checking a secret `ADMIN_TOKEN` passed in headers or cookies.
- Secrets are stored securely in Cloudflare environment variables (`STARTGG_API_TOKEN`, `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `ADMIN_TOKEN`).

## Invariants

1. **Hot-Path Isolation**: Page visitors never query D1 for the active stream list. The client polls `/api/live-streams` which retrieves the JSON directly from Cloudflare KV, protecting D1 from high-frequency read traffic.
2. **Monolith Execution**: The application compiles into a single Cloudflare Worker. The cron worker and request router share the same bundle and database references.
3. **No Database Writes in Cron hot-loops**: The 60-second cron job does not write stream history to D1; it only updates the static KV key.
4. **Subscription Integrity**: Expired or failed push endpoints (returned as 410 Gone from push services) must be immediately deleted from D1 to prevent queue bloat.
