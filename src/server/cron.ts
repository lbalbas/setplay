import { createDb } from "./db";
import { games } from "./db/schema";
import type { Env } from "./db";
import { fetchActiveStreamQueues, fetchUpcomingTournaments } from "./startgg";

export async function handleCronTrigger(event: ScheduledEvent, env: Env): Promise<void> {
  console.log(`[Cron Worker] Triggered at ${new Date(event.scheduledTime).toISOString()}`);

  try {
    const db = createDb(env.DB);
    const trackedGames = await db.select({ startggId: games.startggId }).from(games);

    // Extract valid start.gg Videogame IDs (e.g. 43868 for SF6, 49783 for Tekken 8)
    const startggGameIds = trackedGames
      .map((g) => g.startggId)
      .filter((id): id is number => typeof id === "number");

    console.log(`[Cron Worker] Querying start.gg for ${startggGameIds.length} games...`);

    // 1. Test Stream Queue Fetcher
    const streamQueues = await fetchActiveStreamQueues(env, startggGameIds);
    console.log(
      `[Cron Worker] Retrieved ${streamQueues.length} active stream queues from start.gg.`,
    );

    // 2. Test Tournament Calendar Fetcher
    const upcomingTournaments = await fetchUpcomingTournaments(env, startggGameIds);
    console.log(
      `[Cron Worker] Retrieved ${upcomingTournaments.length} upcoming/live tournaments from start.gg.`,
    );

    // Save test output to Cloudflare KV
    await env.KV.put("startgg_queues_test", JSON.stringify(streamQueues, null, 2));
    await env.KV.put("startgg_calendar_test", JSON.stringify(upcomingTournaments, null, 2));
  } catch (error) {
    console.error(`[Cron Worker] start.gg test failed:`, error);
  }
}
