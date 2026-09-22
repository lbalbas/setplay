import type { Event } from "./db/schema";
import type { StartGGStreamQueueItem } from "./startgg";
import type { TwitchStream } from "./twitch";

// ---------------------------------------------------------------------------
// Matching Engine Types & Interfaces
// ---------------------------------------------------------------------------

/**
 * Indicates whether a stream is matched to an active tournament or categorized as casual.
 */
export type StreamType = "tournament" | "casual";

/**
 * Identifies which layer of the matching engine linked the stream to an event.
 */
export type MatchSource =
  | "start_gg_queue" // Layer 1: Official start.gg stream queue assignment
  | "channel_registry" // Layer 2: Known tournament organizer channel registry
  | "title_pattern"; // Layer 3: Stream title regex / keyword match

/**
 * Event metadata attached when a stream is matched to an active tournament.
 */
export interface MatchedEventInfo {
  eventId: string;
  eventName: string;
  eventSlug: string;
  startggSlug?: string | null;
  matchSource: MatchSource;
  confidence: number;
}

/**
 * Normalized live stream object output by the matching engine.
 * Cached in Cloudflare KV ('live_streams') and consumed by the frontend.
 */
export interface MatchedStream {
  id: string; // Twitch stream ID
  streamName: string; // Twitch user_login (cleaned lowercase handle, e.g. "capcomfighters")
  displayName: string; // Twitch user_name (display name, e.g. "CapcomFighters")
  title: string; // Stream title
  gameId: string; // Twitch Game ID (e.g. "518605")
  gameName: string; // Twitch Game name (e.g. "Street Fighter 6")
  viewerCount: number; // Current live viewers
  startedAt: string; // Stream start ISO timestamp
  thumbnailUrl: string; // Preview image URL
  isMature: boolean; // Mature content flag
  streamType: StreamType; // "tournament" | "casual"
  matchedEvent: MatchedEventInfo | null;
  bracketUrl?: string | null; // e.g. "https://start.gg/tournament/evo-2026"
  stageName?: string | null; // e.g. "Top 8", "Grand Finals", "Pools"
}

// Map event slug keywords to known organizer Twitch channel handles (all lowercase)
const KNOWN_CHANNELS: Record<string, string[]> = {
  evo: ["evo", "evo2", "evo3", "evo4", "evo5", "evo6", "evo7"],
  ceo: ["ceogaming"],
  ceotaku: ["ceogaming", "tampaneversleeps"],
  "combo-breaker": ["teamsp00ky", "tampaneversleeps", "capcomfighters"],
  "capcom-pro-tour": ["capcomfighters"],
  cpt: ["capcomfighters"],
  vsfighting: ["vsfighting"],
  "red-bull-kumite": ["redbull"],
  nlbc: ["teamsp00ky"],
  "next-level-battle-circuit": ["teamsp00ky"],
  wnf: ["leveluplive"],
  "wednesday-night-fights": ["leveluplive"],
  dreamhack: ["dreamhackfighters"],
  "texas-showdown": ["txshowdownlive"],
  bam: ["couchwarriors"],
  "battle-arena-melbourne": ["couchwarriors"],
  tns: ["tampaneversleeps"],
  "tampa-never-sleeps": ["tampaneversleeps"],
  genesis: ["genesisgg"],
  collision: ["collisioneriestv"],
  goml: ["evenmatchupgaming", "evenmatchupgaming2"],
  "get-on-my-level": ["evenmatchupgaming"],
  "smash-factor": ["smashfactorgaming"],
  pound: ["vgbootcamp"],
  glitch: ["vgbootcamp"],
  momocon: ["momocontv"],
  "defend-the-north": ["brooklynvideogames"],
  "frosty-faustings": ["tampaneversleeps"],
  "the-mixup": ["themixuplyon", "themixuplyon2", "themixuplyon3"],
};

function tryMatchTitle(streamTitle: string, activeEvents: Event[]) {
  // 1. Stage indicator regex (matches "pools", "top 8", "finals", etc.)
  const stageRegex =
    /\b(pools?|top\s*\d+|finals?|winners?|losers?|brackets?|qualifiers?|semis?)\b/i;

  // Check if the stream title even has a stage indicator
  if (!stageRegex.test(streamTitle)) {
    return null; // No stage word found -> no match
  }

  // 2. Look for a matching event
  for (const event of activeEvents) {
    // Extract main keywords from the event name/slug (e.g., "EVO", "Combo Breaker")
    // We clean out common 4-digit years like "2026" so "EVO 2026" can match just "EVO"
    const cleanedName = event.name.replace(/\b20\d\d\b/g, "").trim();

    // Create regex matching the cleaned name or slug (escaped for safety)
    const eventRegex = new RegExp(
      `\\b(${escapeRegex(cleanedName)}|${escapeRegex(event.slug)})\\b`,
      "i",
    );

    if (eventRegex.test(streamTitle)) {
      // Both stage indicator AND event keyword matched!
      return {
        event,
        matchSource: "title_pattern",
        confidence: 0.75,
      };
    }
  }

  return null;
}

// Helper to escape special regex characters in event names (like parentheses or hyphens)
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchStreams(
  liveStreams: TwitchStream[],
  streamQueues: StartGGStreamQueueItem[],
  activeEvents: Event[],
): MatchedStream[] {
  const matchedStreams: MatchedStream[] = [];

  for (const stream of liveStreams) {
    //Layer 1: Start.gg Stream Queue | Confidence : 1.0
    const queueItem = streamQueues.find(
      (item) => item.streamName === stream.user_login.toLowerCase(),
    );

    if (queueItem) {
      const event = activeEvents.find(
        (e) => e.slug === queueItem.tournamentSlug || e.startggSlug === queueItem.tournamentSlug,
      );
      if (event) {
        matchedStreams.push({
          id: stream.id,
          streamName: stream.user_login.toLowerCase(),
          displayName: stream.user_name,
          title: stream.title,
          gameId: stream.game_id,
          gameName: stream.game_name,
          viewerCount: stream.viewer_count,
          startedAt: stream.started_at,
          thumbnailUrl: stream.thumbnail_url,
          isMature: stream.is_mature,
          streamType: "tournament",
          bracketUrl: getBracketUrl(event),
          stageName: extractStageName(stream.title) ?? "Tournament Bracket",
          matchedEvent: {
            eventId: event.id,
            eventName: event.name,
            eventSlug: event.slug,
            startggSlug: event.startggSlug,
            matchSource: "start_gg_queue",
            confidence: 1.0,
          },
        });
        continue;
      }
    }
    // Layer 2: Channel Registry | Confidence : 0.9
    let registryEvent: Event | undefined;
    const streamChannel = stream.user_login.toLowerCase();

    for (const [eventKeyword, channels] of Object.entries(KNOWN_CHANNELS)) {
      if (channels.includes(streamChannel)) {
        registryEvent = activeEvents.find(
          (e) =>
            e.slug.toLowerCase() === eventKeyword ||
            e.slug.toLowerCase().includes(eventKeyword) ||
            (e.startggSlug && e.startggSlug.toLowerCase().includes(eventKeyword)),
        );
        if (registryEvent) break;
      }
    }
    if (registryEvent) {
      matchedStreams.push({
        id: stream.id,
        streamName: stream.user_login.toLowerCase(),
        displayName: stream.user_name,
        title: stream.title,
        gameId: stream.game_id,
        gameName: stream.game_name,
        viewerCount: stream.viewer_count,
        startedAt: stream.started_at,
        thumbnailUrl: stream.thumbnail_url,
        isMature: stream.is_mature,
        streamType: "tournament",
        stageName: extractStageName(stream.title) ?? "Tournament Bracket",
        matchedEvent: {
          eventId: registryEvent.id,
          eventName: registryEvent.name,
          eventSlug: registryEvent.slug,
          startggSlug: registryEvent.startggSlug,
          matchSource: "channel_registry",
          confidence: 0.9,
        },
      });
      continue;
    }

    // Layer 3: Title Pattern Match | Confidence : 0.75
    const titleMatch = tryMatchTitle(stream.title, activeEvents);

    if (titleMatch) {
      matchedStreams.push({
        id: stream.id,
        streamName: stream.user_login.toLowerCase(),
        displayName: stream.user_name,
        title: stream.title,
        gameId: stream.game_id,
        gameName: stream.game_name,
        viewerCount: stream.viewer_count,
        startedAt: stream.started_at,
        thumbnailUrl: stream.thumbnail_url,
        isMature: stream.is_mature,
        streamType: "tournament",
        bracketUrl: getBracketUrl(titleMatch.event),
        stageName: extractStageName(stream.title) ?? "Tournament Bracket",
        matchedEvent: {
          eventId: titleMatch.event.id,
          eventName: titleMatch.event.name,
          eventSlug: titleMatch.event.slug,
          startggSlug: titleMatch.event.startggSlug,
          matchSource: "title_pattern",
          confidence: 0.75,
        },
      });
      continue;
    }

    // Layer 4: Fallback Casual Stream
    matchedStreams.push({
      id: stream.id,
      streamName: stream.user_login.toLowerCase(),
      displayName: stream.user_name,
      title: stream.title,
      gameId: stream.game_id,
      gameName: stream.game_name,
      viewerCount: stream.viewer_count,
      startedAt: stream.started_at,
      thumbnailUrl: stream.thumbnail_url,
      isMature: stream.is_mature,
      streamType: "casual",
      matchedEvent: null,
    });
  }

  return matchedStreams.sort((a, b) => {
    // 1. Tournaments before casual streams
    if (a.streamType !== b.streamType) {
      return a.streamType === "tournament" ? -1 : 1;
    }
    // 2. Higher confidence matches first
    if (
      a.matchedEvent &&
      b.matchedEvent &&
      a.matchedEvent.confidence !== b.matchedEvent.confidence
    ) {
      return b.matchedEvent.confidence - a.matchedEvent.confidence;
    }
    // 3. Higher viewer count first
    return b.viewerCount - a.viewerCount;
  });
}

export function extractStageName(title: string): string | null {
  // Ordered from most specific to general
  const patterns: [RegExp, string][] = [
    [/\b(grand\s*finals?|gf)\b/i, "Grand Finals"],
    [/\b(winners?\s*finals?|wf)\b/i, "Winners Finals"],
    [/\b(losers?\s*finals?|lf)\b/i, "Losers Finals"],
    [/\b(top\s*4)\b/i, "Top 4"],
    [/\b(top\s*8)\b/i, "Top 8"],
    [/\b(top\s*16)\b/i, "Top 16"],
    [/\b(top\s*24)\b/i, "Top 24"],
    [/\b(top\s*32)\b/i, "Top 32"],
    [/\b(top\s*64)\b/i, "Top 64"],
    [/\b(semis?|semi[\s-]*finals?)\b/i, "Semifinals"],
    [/\b(quarter[\s-]*finals?|quarters?)\b/i, "Quarterfinals"],
    [/\b(pools?\s*(day\s*\d+|wave\s*[a-z0-9]+)?)\b/i, "Pools"],
    [/\b(qualifiers?)\b/i, "Qualifiers"],
    [/\b(bracket\s*reset)\b/i, "Bracket Reset"],
  ];

  for (const [regex, label] of patterns) {
    if (regex.test(title)) {
      return label;
    }
  }

  return null;
}

export function getBracketUrl(event: Event): string | null {
  if (event.registrationUrl) {
    return event.registrationUrl;
  }
  const slug = event.startggSlug || event.slug;
  if (slug) {
    // If slug is already "tournament/evo-2026" or "evo-2026"
    return slug.startsWith("tournament/")
      ? `https://start.gg/${slug}`
      : `https://start.gg/tournament/${slug}`;
  }
  return null;
}
