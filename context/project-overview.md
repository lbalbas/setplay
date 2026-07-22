# SetPlay

## Overview

SetPlay is a real-time tournament calendar, stream-to-event matching, and stream discoverability platform tailored for the fighting game community (FGC). It queries tournament platforms and streaming APIs, applies a layered matching algorithm to link active Twitch broadcasts to ongoing brackets, and displays live streams—including both primary tournament broadcasts and general casual/pro-player streams—along with relevant event metadata and live chat. By combining tournament feeds with general streams, it serves as a central hub to enhance overall stream discoverability for the FGC.

## Goals

1. **Aggregated Live Stream Dashboard**: Provide a central, responsive interface to view active FGC streams, prioritizing live tournament broadcasts while also showcasing general casual/pro streams (to boost discoverability), sorted and filterable by game and event.
2. **Stream-to-Bracket Matching**: Automatically detect when a stream is broadcasting a specific bracket match or tournament stage using a multi-layer algorithm, linking the video player directly to the bracket metadata.
3. **Frictionless Localized User Preferences**: Allow users to follow games/events to filter their feeds without requiring them to create a formal user account.
4. **Push Notifications**: Notify subscribed browsers/devices when followed games or featured tournament events go live.
5. **Basic Administrator Control**: Provide a lightweight admin interface to manually seed events, manage stream-event mappings, or force matching overrides.

## Core User Flow

1. **Browse Dashboard**: User lands on the SetPlay homepage. They see a prioritized feed of live tournament streams mapped to active events, followed by active casual/pro fighting game streams, plus a calendar of upcoming tournaments.
2. **Filter & Personalize**: User filters the list by clicking a game (e.g., _Street Fighter 6_, _Tekken 8_). They can "follow" a game, storing this preference in their browser's `localStorage` so it is pre-selected on future visits.
3. **Watch Inline**: User clicks a stream. The page loads an inline Twitch or YouTube player with the tournament or channel's Twitch chat panel displayed next to it.
4. **Subscribe to Alerts**: User clicks "Notify me when this goes live" on a game or a specific tournament. The browser requests push notification permissions and registers the subscription in the database.
5. **Receive Alerts**: When the background cron worker detects that a followed game or event has gone live, a Web Push notification is sent to the user's device.
6. **Admin Overrides**: An administrator logs in via a token-protected route `/admin` and can manually link a stream to an event or fix matching errors.

## Features

### In Scope

- **API Ingestion Worker**: Periodic backend polling of the start.gg GraphQL API to sync event calendars and Twitch Helix API to discover live broadcasts.
- **Stream-to-Event Matching Algorithm**: A 4-layered filtering process (start.gg Stream Queue, Known Channel Registry, Title Pattern Matching, and Community Submission) running on a schedule to map live streams to database events. Streams that do not match an active tournament are kept in the feed as general/casual streams to support discovery.
- **Unified Dashboard (`/`)**: Home page with active live streams (prioritizing matched tournament streams), quick game filters, and a sidebar calendar widget.
- **Watch View (`/watch/$streamName`)**: Split-screen view containing a responsive Twitch/YouTube iframe video player, toggleable live chat sidebar, event bracket details, and push notification actions.
- **Events Directory (`/events`)**: A calendar view listing active, upcoming, and completed brackets.
- **Admin Dashboard (`/admin`)**: A token-protected control room for manual overrides, bracket seeding, and system status logs.
- **LocalStorage Preferences**: No-login personalization to save followed games and events.
- **Web Push Notifications**: Service-worker-based browser notifications with subscription interests mapped to games or events.

### Out of Scope

- **User Accounts & Social Logins**: No login required for users in the MVP; all settings are local.
- **Paid Subscription & Billing**: Free tool; no billing integration.
- **Historical Stream Analytics**: No database records of historical stream statistics or viewer count logs.
- **Mobile App Builds**: Web-only application (fully responsive for mobile browsers).

## Success Criteria

1. Home page successfully displays live streams grouped/tagged with matching event brackets.
2. Filtering by game dynamically updates the active stream list instantly.
3. Subscribing to push notifications registers the client, and a simulated event launch successfully triggers a browser alert.
4. Admin panel allows modifying event status and manually mapping a stream.
5. Ingest and matching scripts run on the serverless edge with zero cold-starts or performance degradation.
