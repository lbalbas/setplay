import { createServerFn } from "@tanstack/react-start";
import { createDb } from "./db";
import { events, eventGames, games } from "./db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getWorkerEnv } from "./env";

export type EventWithGames = typeof events.$inferSelect & { games: (typeof games.$inferSelect)[] };

export const getEvents = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = await getWorkerEnv(context);

  if (!env?.DB) {
    console.warn("[getEvents] D1 DB binding not found.");
    return [];
  }

  const db = createDb(env.DB);

  // Time boundary: events ending within the last 30 days up to starting within 12 months (365 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // Query active, upcoming, and recent completed events
  const rawEvents = await db
    .select({
      event: events,
      game: games,
    })
    .from(events)
    .leftJoin(eventGames, eq(events.id, eventGames.eventId))
    .leftJoin(games, eq(eventGames.gameId, games.id))
    .where(and(gte(events.endDate, thirtyDaysAgo), lte(events.startDate, oneYearFromNow)));

  // Group many-to-many game relations per event
  const eventMap = new Map<
    string,
    typeof events.$inferSelect & { games: (typeof games.$inferSelect)[] }
  >();

  for (const row of rawEvents) {
    if (!eventMap.has(row.event.id)) {
      eventMap.set(row.event.id, {
        ...row.event,
        games: [],
      });
    }
    if (row.game) {
      eventMap.get(row.event.id)!.games.push(row.game);
    }
  }

  return Array.from(eventMap.values());
});
