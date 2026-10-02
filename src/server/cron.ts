import { createDb } from "./db";
import { games, events, eventGames, pushSubscriptions } from "./db/schema";
import { lt, lte, gte, and, sql } from "drizzle-orm";
import type { Env } from "./db";
import { fetchLiveStreamsByGame } from "./twitch";
import { fetchActiveStreamQueues, fetchUpcomingTournaments } from "./startgg";
import { matchStreams } from "./matching";
import { dispatchPushToEventSubscribers } from "./push";
import type { Event } from "./db/schema";
import type { StartGGTournament } from "./startgg";

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
  console.log(`[Cron Worker] Triggered at ${new Date().toISOString()}`);

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

    console.log(`[Cron Worker] Querying start.gg for ${startggGameIds.length} games...`);

    const streamQueues = await fetchActiveStreamQueues(env, startggGameIds);
    console.log(
      `[Cron Worker] Retrieved ${streamQueues.length} active stream queues from start.gg.`,
    );

    const activeStreams = await fetchLiveStreamsByGame(env, twitchGameIds);

    const matchedStreams = matchStreams(activeStreams, streamQueues, activeEvents);

    await env.KV.put("live_streams", JSON.stringify(matchedStreams));
    console.log(
      `[Cron Worker] Matched ${matchedStreams.length} streams to active events and stored in KV.`,
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

        // Set 24-hour cooldown flag in KV to prevent duplicate notifications during the event
        await env.KV.put(alertKey, "1", { expirationTtl: 86400 });
      }
    }
  } catch (error) {
    console.error(`[Cron Worker] 60s stream matching failed:`, error);
  }
}

export async function run6HourCalendarSync(env: Env): Promise<void> {
  console.log(`[Cron Worker] Triggered at ${new Date().toISOString()}`);

  try {
    const db = createDb(env.DB);
    const trackedGames = await db
      .select({ twitchId: games.id, startggId: games.startggId })
      .from(games);

    const startggVideogameIds = trackedGames
      .map((g) => g.startggId)
      .filter((id): id is number => typeof id === "number");

    console.log(`[Cron Worker] Querying start.gg for ${startggVideogameIds.length} games...`);
    const upcomingTournaments = await fetchUpcomingTournaments(env, startggVideogameIds);
    console.log(
      `[Cron Worker] Retrieved ${upcomingTournaments.length} upcoming tournaments from start.gg.`,
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

    await pruneExpiredSubscriptions(db);
  } catch (error) {
    console.error(`[Cron Worker] Calendar sync failed:`, error);
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

function getBracketUrlFromTournament(tournament: StartGGTournament): string | null {
  const slug = tournament.slug;
  if (slug) {
    return slug.startsWith("tournament/")
      ? `https://start.gg/${slug}`
      : `https://start.gg/tournament/${slug}`;
  }
  return null;
}
