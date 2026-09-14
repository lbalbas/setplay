import { z } from "zod";
import type { Env } from "./db";

// ---------------------------------------------------------------------------
// 1. Zod Validation Schemas for GraphQL Responses
// ---------------------------------------------------------------------------

/**
 * Validates an individual stream item attached to a tournament in start.gg.
 */
export const StartGGStreamSchema = z.object({
  id: z.number().or(z.string()),
  streamName: z.string(), // e.g. "capcomfighters" or "teamspooky"
  streamSource: z.string(), // e.g. "TWITCH"
});

/**
 * Validates sub-events within a tournament (e.g., "Street Fighter 6 Singles").
 */
export const StartGGEventSchema = z.object({
  id: z.number().or(z.string()),
  name: z.string(),
  videogame: z
    .object({
      id: z.number(), // start.gg Videogame ID (e.g. 43868)
    })
    .nullable()
    .optional(),
});

/**
 * Validates tournament nodes for stream queue queries.
 */
export const StartGGTournamentQueueNodeSchema = z.object({
  id: z.number().or(z.string()),
  name: z.string(),
  slug: z.string(),
  events: z.array(StartGGEventSchema).nullable().optional(),
  streams: z.array(StartGGStreamSchema).nullable().optional(),
});

/**
 * Validates the root GraphQL response for Stream Queue queries.
 */
export const StartGGStreamQueueResponseSchema = z.object({
  data: z
    .object({
      tournaments: z
        .object({
          nodes: z.array(StartGGTournamentQueueNodeSchema).nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

/**
 * Validates tournament images (banners, logos).
 */
export const StartGGImageSchema = z.object({
  type: z.string(),
  url: z.string(),
});

/**
 * Validates tournament nodes for calendar/sync queries.
 */
export const StartGGTournamentCalendarNodeSchema = z.object({
  id: z.number().or(z.string()),
  name: z.string(),
  slug: z.string(),
  startAt: z.number(), // Unix timestamp (seconds)
  endAt: z.number(), // Unix timestamp (seconds)
  isOnline: z.boolean().nullable().optional(),
  city: z.string().nullable().optional(),
  addrState: z.string().nullable().optional(),
  countryCode: z.string().nullable().optional(),
  images: z.array(StartGGImageSchema).nullable().optional(),
  numAttendees: z.number().nullable().optional(),
  events: z.array(StartGGEventSchema).nullable().optional(),
});

/**
 * Validates the root GraphQL response for Tournament Calendar queries.
 */
export const StartGGTournamentCalendarResponseSchema = z.object({
  data: z
    .object({
      tournaments: z
        .object({
          nodes: z.array(StartGGTournamentCalendarNodeSchema).nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  errors: z.array(z.object({ message: z.string() })).optional(),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript Types & Domain Interfaces
// ---------------------------------------------------------------------------

export interface StartGGStreamQueueItem {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  streamName: string; // Cleaned lowercase Twitch handle
  streamSource: string;
  featuredVideogameIds: number[];
}

export interface StartGGTournament {
  id: string;
  name: string;
  slug: string;
  startAt: number;
  endAt: number;
  isOnline: boolean;
  location: string | null;
  bannerUrl: string | null;
  numAttendees: number | null;
  gameIds: number[];
}

// ---------------------------------------------------------------------------
// 2. Generic GraphQL Client Helper
// ---------------------------------------------------------------------------

/**
 * Sends a GraphQL POST request to start.gg's alpha endpoint,
 * authenticates using STARTGG_API_TOKEN, and validates the response with Zod.
 */
export async function queryStartGG<T>(
  env: Env,
  query: string,
  variables: Record<string, unknown>,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const token = env.STARTGG_API_TOKEN;

  if (!token) {
    throw new Error("STARTGG_API_TOKEN environment secret is missing.");
  }

  const response = await fetch("https://api.start.gg/gql/alpha", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`start.gg API request failed (${response.status}): ${errorText}`);
  }

  const json = (await response.json()) as Record<string, any>;

  if (json && typeof json === "object" && Array.isArray(json.errors) && json.errors.length > 0) {
    const errorMessages = json.errors.map((e: { message?: string }) => e.message || String(e)).join("; ");
    throw new Error(`start.gg GraphQL returned errors: ${errorMessages}`);
  }

  const parsed = schema.parse(json) as T;
  return parsed;
}
// ---------------------------------------------------------------------------
// 3. Active Stream Queue Fetcher (For 60s Stream Matching Engine)
// ---------------------------------------------------------------------------

const ACTIVE_STREAMS_QUERY = `
  query ActiveStreamQueues($videogameIds: [ID]!) {
    tournaments(query: {
      perPage: 25
      filter: {
        videogameIds: $videogameIds
      }
    }) {
      nodes {
        id
        name
        slug
        events {
          id
          name
          videogame {
            id
          }
        }
        streams {
          id
          streamName
          streamSource
        }
      }
    }
  }
`;

/**
 * Fetches active stream queue assignments from start.gg for the given videogame IDs.
 * Used by Layer 1 of the stream matching engine to map Twitch streams to active tournaments.
 */
export async function fetchActiveStreamQueues(
  env: Env,
  startggVideogameIds: number[],
): Promise<StartGGStreamQueueItem[]> {
  if (startggVideogameIds.length === 0) {
    return [];
  }

  const response = await queryStartGG(
    env,
    ACTIVE_STREAMS_QUERY,
    { videogameIds: startggVideogameIds },
    StartGGStreamQueueResponseSchema,
  );

  const nodes = response.data?.tournaments?.nodes || [];
  const queueItems: StartGGStreamQueueItem[] = [];

  for (const node of nodes) {
    if (!node.streams || node.streams.length === 0) {
      continue;
    }

    // Extract unique videogame IDs featured in this tournament's events
    const featuredGameIds = (node.events || [])
      .map((e) => e.videogame?.id)
      .filter((id): id is number => typeof id === "number");

    for (const stream of node.streams) {
      // We only track Twitch streams for SetPlay MVP
      if (
        !stream.streamName ||
        (stream.streamSource && stream.streamSource.toUpperCase() !== "TWITCH")
      ) {
        continue;
      }

      // Clean the stream username (lowercase, trim whitespace)
      const cleanStreamName = stream.streamName.trim().toLowerCase();

      queueItems.push({
        tournamentId: String(node.id),
        tournamentName: node.name,
        tournamentSlug: node.slug,
        streamName: cleanStreamName,
        streamSource: "TWITCH",
        featuredVideogameIds: [...new Set(featuredGameIds)],
      });
    }
  }

  return queueItems;
}

// ---------------------------------------------------------------------------
// 4. Tournament Calendar Fetcher (For 6-Hour D1 Database Sync)
// ---------------------------------------------------------------------------

const UPCOMING_TOURNAMENTS_QUERY = `
  query UpcomingTournaments($videogameIds: [ID]!, $afterDate: Timestamp!) {
    tournaments(query: {
      perPage: 50
      filter: {
        videogameIds: $videogameIds
        afterDate: $afterDate
      }
    }) {
      nodes {
        id
        name
        slug
        startAt
        endAt
        isOnline
        city
        addrState
        countryCode
        images {
          type
          url
        }
        numAttendees
        events {
          id
          name
          videogame {
            id
          }
        }
      }
    }
  }
`;

/**
 * Fetches upcoming and active tournaments from start.gg for database syncing.
 *
 * @param env Worker environment bindings
 * @param startggVideogameIds Tracked start.gg Videogame IDs
 * @param afterDateTimestamp Optional Unix timestamp (defaults to 24 hours in the past)
 */
export async function fetchUpcomingTournaments(
  env: Env,
  startggVideogameIds: number[],
  afterDateTimestamp?: number,
): Promise<StartGGTournament[]> {
  if (startggVideogameIds.length === 0) {
    return [];
  }

  // Default to 24 hours in the past to include multi-day tournaments currently in progress
  const afterDate = afterDateTimestamp ?? Math.floor(Date.now() / 1000) - 86400;

  const response = await queryStartGG(
    env,
    UPCOMING_TOURNAMENTS_QUERY,
    { videogameIds: startggVideogameIds, afterDate },
    StartGGTournamentCalendarResponseSchema,
  );

  const nodes = response.data?.tournaments?.nodes || [];
  const tournaments: StartGGTournament[] = [];

  for (const node of nodes) {
    // Format location string (e.g. "Chicago, IL, US" or "Online")
    const isOnline = Boolean(node.isOnline);
    let location: string | null = null;

    if (!isOnline) {
      const parts = [node.city, node.addrState, node.countryCode].filter(Boolean);
      location = parts.length > 0 ? parts.join(", ") : null;
    }

    // Extract primary banner or profile image URL
    const bannerImage = (node.images || []).find(
      (img) => img.type === "banner" || img.type === "profile",
    );

    // Extract featured game IDs
    const gameIds = (node.events || [])
      .map((e) => e.videogame?.id)
      .filter((id): id is number => typeof id === "number");

    tournaments.push({
      id: String(node.id),
      name: node.name,
      slug: node.slug,
      startAt: node.startAt,
      endAt: node.endAt,
      isOnline,
      location,
      bannerUrl: bannerImage?.url || null,
      numAttendees: node.numAttendees ?? null,
      gameIds: [...new Set(gameIds)],
    });
  }

  return tournaments;
}
