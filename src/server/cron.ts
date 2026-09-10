import { createDb } from "./db";
import { games } from "./db/schema";
import type { Env } from "./db";
import { fetchLiveStreamsByGame } from "./twitch";

/**
 * Background Cron Job Handler
 * Triggered periodically by Cloudflare Cron Triggers.
 */
export async function handleCronTrigger(event: ScheduledEvent, env: Env): Promise<void> {
  console.log(`[Cron Worker] Triggered at ${new Date(event.scheduledTime).toISOString()}`);

  try {
    // 1. Connect to D1 Database
    const db = createDb(env.DB);

    // 2. Read tracked game IDs from D1 'games' table
    const trackedGames = await db.select({ id: games.id, name: games.name }).from(games);
    const gameIds = trackedGames.map((g) => g.id);

    console.log(`[Cron Worker] Querying Twitch for ${gameIds.length} games...`);

    // 3. Fetch active live streams from Twitch Helix API
    const liveStreams = await fetchLiveStreamsByGame(env, gameIds);
    console.log(`[Cron Worker] Retrieved ${liveStreams.length} live broadcasts from Twitch.`);

    // 4. Save live streams array to Cloudflare KV under 'live_streams'
    await env.KV.put("live_streams", JSON.stringify(liveStreams));
    console.log(`[Cron Worker] Successfully saved 'live_streams' payload to KV!`);
  } catch (error) {
    console.error(`[Cron Worker] Ingestion failed:`, error);
  }
}
