# SetPlay — API Integrations & Matching Algorithm

This document details the external APIs and matching logic utilized by **SetPlay** to sync tournaments and identify live streams.

---

## 1. start.gg (GraphQL API)

We query start.gg's alpha endpoint (`https://api.start.gg/gql/alpha`) to fetch tournament calendars and stream schedules.

### Authentication
A developer token is generated from start.gg user settings and stored as `STARTGG_API_TOKEN` in the Cloudflare environment variables. It is passed in the headers:
```http
Authorization: Bearer <token>
```

### Rate Limits
- Max **80 requests per 60 seconds**.
- Max **1,000 objects** per GraphQL query complexity.
- If we exceed these, start.gg returns HTTP 429.

### Key Queries
1. **Upcoming Tournaments Ingestion** (Runs every 6 hours):
   Queries tournaments featuring selected `videogameIds` within a date window.
2. **Live Tournament Stream Queue** (Runs every 60 seconds):
   Queries active tournaments to extract their live stream names (`streamName`, e.g. `"teamspooky"`) and the matching sets in the queue.

---

## 2. Twitch API (Helix REST API)

We query the Twitch Helix API to discover live broadcasts.

### Authentication
Uses Client ID and Client Secret stored in Cloudflare environment variables.
1. Authenticate using OAuth Client Credentials Grant:
   `POST https://id.twitch.tv/oauth2/token?client_id=ID&client_secret=SECRET&grant_type=client_credentials`
2. Store the returned `access_token` and `expires_in` in Cloudflare KV.
3. For subsequent requests, retrieve the token from KV and append as headers:
   ```http
   Client-Id: <client_id>
   Authorization: Bearer <access_token>
   ```

### Live Streams Endpoint
```http
GET https://api.twitch.tv/helix/streams?game_id=518605&game_id=18431
```
Queries multiple game IDs in parallel to find all streams active under those categories.

---

## 3. The Stream-to-Event Matching Algorithm

To determine if a live Twitch stream is broadcasting a tournament and link it to the correct database event, we run a 4-layered filtering process in our cron worker:

```text
               [ Live Twitch Stream ]
                         │
                         ▼
        ┌──────────────────────────────────┐
        │  Layer 1: start.gg Stream Queue  │ ──► Match Found? ──► YES (Confidence: 100%)
        └──────────────────────────────────┘
                         │ NO
                         ▼
        ┌──────────────────────────────────┐
        │ Layer 2: Known Channel Registry  │ ──► Match Found? ──► YES (Confidence: 90%)
        └──────────────────────────────────┘
                         │ NO
                         ▼
        ┌──────────────────────────────────┐
        │ Layer 3: Title Pattern Matching  │ ──► Match Found? ──► YES (Confidence: 75-85%)
        └──────────────────────────────────┘
                         │ NO
                         ▼
        ┌──────────────────────────────────┐
        │  Layer 4: Community Submission   │ ──► Match Found? ──► YES (Confidence: 60%)
        └──────────────────────────────────┘
                         │ NO
                         ▼
                   [ Discard Stream ]
                   (Casual / Pro-Player)
```

### Matching Rules:
1. **authoritative matching (Layer 1)**: If `streamName` is returned inside the start.gg `streamQueue` query, we link it immediately with 100% confidence.
2. **registry matching (Layer 2)**: We cross-reference the stream channel name against a database table or static list of known TO channels (e.g., `TampaNeverSleeps`, `leveluplive`, `bgcallisto`). If a known channel is streaming and there is an active event for that game today, we link them.
3. **fuzzy title matching (Layer 3)**: Parse the stream title (e.g., `"[SF6] CEO 2026 Day 2 Pools - Stream A"`). Search our active events database for matching keywords (e.g., `"CEO 2026"`). If a match exceeds a threshold, link with high confidence.
4. **community reporting (Layer 4)**: Fallback where users/moderators can manually flag a stream link to an active tournament on the admin dashboard.
