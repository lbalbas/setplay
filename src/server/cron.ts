import { createDb } from "./db";
import { games, events, eventGames, pushSubscriptions } from "./db/schema";
import { lt, lte, gte, gt, eq, and, sql } from "drizzle-orm";
import type { Env } from "./db";
import { fetchLiveStreamsByGame } from "./twitch";
import { fetchActiveStreamQueues, fetchUpcomingTournaments } from "./startgg";
import { matchStreams } from "./matching";
import { dispatchPushToEventSubscribers } from "./push";
import type { Event } from "./db/schema";
import type { StartGGTournament } from "./startgg";

export type CronLogTag = "stream-sync" | "calendar-sync" | "push-notify" | "bracket-poll";
export type CronLogStatus = "success" | "info" | "warning" | "error";

export interface CronLogEntry {
  id: string;
  timestamp: string;
  tag: CronLogTag;
  status: CronLogStatus;
  message: string;
  error?: string | null;
}

export const CRON_LOGS_KEY = "cron_logs";
export const MAX_CRON_LOGS = 250;

export async function handleCronTrigger(event: ScheduledEvent, env: Env): Promise<void> {
  const cronPattern = event.cron;
  console.log(
    `[Cron Worker] Triggered schedule '${cronPattern}' at ${new Date(event.scheduledTime).toISOString()}`,
  );

  // Dispatch based on cron schedule
  if (cronPattern === "0 */6 * * *") {
    await run6HourCalendarSync(env);
  } else {
    // Default or "* * * * *" runs the 60s stream matching job
    await run60sStreamMatching(env);
  }
}

export async function run60sStreamMatching(env: Env): Promise<void> {
  const logs: CronLogEntry[] = [];
  recordLog(
    logs,
    "stream-sync",
    "info",
    `60s Stream Sync triggered at ${new Date().toISOString()}`,
  );

  try {
    const db = createDb(env.DB);
    const trackedGames = await db
      .select({ twitchId: games.id, startggId: games.startggId })
      .from(games);

    const activeEvents = await db
      .select()
      .from(events)
      .where(and(lte(events.startDate, new Date()), gte(events.endDate, new Date())));

    const startggGameIds = trackedGames
      .map((g) => g.startggId)
      .filter((id): id is number => typeof id === "number");

    const twitchGameIds = trackedGames
      .map((g) => g.twitchId)
      .filter((id): id is string => typeof id === "string");

    recordLog(
      logs,
      "stream-sync",
      "info",
      `Querying start.gg for ${startggGameIds.length} games...`,
    );

    const streamQueues = await fetchActiveStreamQueues(env, startggGameIds);

    recordLog(
      logs,
      "stream-sync",
      "success",
      `Retrieved ${streamQueues.length} active stream queues from start.gg.`,
    );

    const activeStreams = await fetchLiveStreamsByGame(env, twitchGameIds);

    const matchedStreams = matchStreams(activeStreams, streamQueues, activeEvents);

    await env.KV.put("live_streams", JSON.stringify(matchedStreams));

    recordLog(
      logs,
      "stream-sync",
      "success",
      `Matched ${matchedStreams.length} streams to active events and stored in KV.`,
    );

    // Check for active tournament streams and dispatch push alerts to event subscribers
    const activeTournamentStreams = matchedStreams.filter(
      (s) => s.streamType === "tournament" && s.matchedEvent?.eventId,
    );

    for (const stream of activeTournamentStreams) {
      if (!stream.matchedEvent) continue;
      const eventId = stream.matchedEvent.eventId;
      const alertKey = `event_alert_sent:${eventId}`;

      const alreadyAlerted = await env.KV.get(alertKey);
      if (!alreadyAlerted) {
        await dispatchPushToEventSubscribers(db, env, eventId, {
          eventId,
          title: `🏆 ${stream.matchedEvent.eventName} is Live!`,
          body: `${stream.displayName} is broadcasting "${stream.title}"`,
          url: `/events`,
        });

        recordLog(
          logs,
          "push-notify",
          "info",
          `Dispatched push alerts for live event: ${stream.matchedEvent.eventName}`,
        );

        // Set 24-hour cooldown flag in KV to prevent duplicate notifications during the event
        await env.KV.put(alertKey, "1", { expirationTtl: 86400 });
      }
    }
  } catch (error) {
    recordLog(logs, "stream-sync", "error", "60s stream matching failed", error);
  } finally {
    await flushCronLogs(env, logs);
  }
}

export async function run6HourCalendarSync(env: Env): Promise<void> {
  const logs: CronLogEntry[] = [];
  recordLog(
    logs,
    "calendar-sync",
    "info",
    `6-hour Calendar Sync triggered at ${new Date().toISOString()}`,
  );

  try {
    const db = createDb(env.DB);
    const trackedGames = await db
      .select({ twitchId: games.id, startggId: games.startggId })
      .from(games);

    const startggVideogameIds = trackedGames
      .map((g) => g.startggId)
      .filter((id): id is number => typeof id === "number");

    recordLog(
      logs,
      "calendar-sync",
      "info",
      `Querying start.gg for ${startggVideogameIds.length} games...`,
    );
    const upcomingTournaments = await fetchUpcomingTournaments(env, startggVideogameIds);
    recordLog(
      logs,
      "calendar-sync",
      "success",
      `Retrieved ${upcomingTournaments.length} upcoming tournaments from start.gg.`,
    );

    const processedEvents = formatTournaments(upcomingTournaments);
    const BATCH_SIZE = 5;

    for (let i = 0; i < processedEvents.length; i += BATCH_SIZE) {
      const batch = processedEvents.slice(i, i + BATCH_SIZE);
      await db
        .insert(events)
        .values(batch)
        .onConflictDoUpdate({
          target: events.id,
          set: {
            name: sql`excluded.name`,
            startDate: sql`excluded.start_date`,
            endDate: sql`excluded.end_date`,
            status: sql`excluded.status`,
            imageUrl: sql`excluded.image_url`,
            attendeeCount: sql`excluded.attendee_count`,
            location: sql`excluded.location`,
            isOnline: sql`excluded.is_online`,
          },
        });
    }

    const startggToTwitchMap = new Map<number, string>();
    for (const game of trackedGames) {
      if (game.startggId && game.twitchId) {
        startggToTwitchMap.set(game.startggId, game.twitchId);
      }
    }

    for (const tournament of upcomingTournaments) {
      const eventId = String(tournament.id);
      for (const startggGameId of tournament.gameIds) {
        const twitchGameId = startggToTwitchMap.get(startggGameId);
        if (twitchGameId) {
          await db
            .insert(eventGames)
            .values({
              eventId,
              gameId: twitchGameId,
            })
            .onConflictDoNothing(); // Ignore if (eventId, gameId) pair already exists
        }
      }
    }

    recordLog(
      logs,
      "calendar-sync",
      "success",
      `Upserted ${processedEvents.length} tournaments and game relations to D1.`,
    );

    await pruneExpiredSubscriptions(db);
    await pruneOldEvents(db);

    recordLog(
      logs,
      "calendar-sync",
      "info",
      "Maintenance: Pruned expired subscriptions and outdated events.",
    );
  } catch (error) {
    recordLog(logs, "calendar-sync", "error", "Calendar sync failed", error);
  } finally {
    await flushCronLogs(env, logs);
  }
}

//Helper function to format tournaments into events
function formatTournaments(upcomingTournaments: StartGGTournament[]): Event[] {
  const events: Event[] = [];
  for (const tournament of upcomingTournaments) {
    const event: Event = {
      id: String(tournament.id),
      name: tournament.name,
      startDate: new Date(tournament.startAt * 1000),
      endDate: new Date(tournament.endAt * 1000),
      slug: tournament.slug,
      source: "start_gg",
      startggSlug: tournament.slug,
      isOnline: tournament.isOnline,
      location: tournament.location,
      imageUrl: tournament.bannerUrl,
      attendeeCount: tournament.numAttendees,
      bracketUrl: getBracketUrlFromTournament(tournament),
      status: calculateTournamentStatus(tournament.startAt, tournament.endAt),
      featuredPriority: "normal",
      description: null,
      region: null,
      registrationUrl: null,
      prizePool: null,
    };
    events.push(event);
  }
  return events;
}

//Helper function to determine the status of a tournament
function calculateTournamentStatus(
  startAt: number,
  endAt: number,
): "upcoming" | "live" | "completed" {
  const now = Math.floor(Date.now() / 1000);
  if (now < startAt) {
    return "upcoming";
  } else if (now >= startAt && now <= endAt) {
    return "live";
  } else {
    return "completed";
  }
}

async function pruneExpiredSubscriptions(db: ReturnType<typeof createDb>): Promise<void> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  await db.delete(pushSubscriptions).where(lt(pushSubscriptions.createdAt, ninetyDaysAgo));

  console.log(`[Cron Worker] Maintenance: Pruned expired push subscriptions.`);
}

async function pruneOldEvents(db: ReturnType<typeof createDb>): Promise<void> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // Find events that ended more than 90 days ago OR bogus far-future events (> 12 months away)
  const oldEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(lt(events.endDate, ninetyDaysAgo));

  const farFutureEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(gt(events.startDate, oneYearFromNow));

  const toDelete = [...oldEvents, ...farFutureEvents];
  if (toDelete.length > 0) {
    for (const item of toDelete) {
      await db.delete(eventGames).where(eq(eventGames.eventId, item.id));
      await db.delete(events).where(eq(events.id, item.id));
    }
    console.log(
      `[Cron Worker] Maintenance: Pruned ${toDelete.length} outdated or far-future events.`,
    );
  }
}

function getBracketUrlFromTournament(tournament: StartGGTournament): string | null {
  const slug = tournament.slug;
  if (slug) {
    return slug.startsWith("tournament/")
      ? `https://start.gg/${slug}`
      : `https://start.gg/tournament/${slug}`;
  }
  return null;
}

function recordLog(
  batch: CronLogEntry[],
  tag: CronLogTag,
  status: CronLogStatus,
  message: string,
  error?: unknown,
) {
  console.log(`[${tag}][Cron Worker] ${message}`);
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  batch.push({
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    tag,
    status,
    message,
    error: errorMessage,
  });
}

async function flushCronLogs(env: Env, newLogs: CronLogEntry[]): Promise<void> {
  if (newLogs.length === 0) return;
  try {
    const existingLogs = (await env.KV.get(CRON_LOGS_KEY, "json")) as CronLogEntry[] | null;
    const combined = [...newLogs, ...(existingLogs || [])].slice(0, MAX_CRON_LOGS);
    await env.KV.put(CRON_LOGS_KEY, JSON.stringify(combined), {
      expirationTtl: 86400 * 7,
    });
  } catch (err) {
    console.error("[Cron Worker] Failed to flush logs to KV:", err);
  }
}
