import type { Page } from "@playwright/test";
import type { MatchedStream } from "#/server/matching";

export const FIXTURE_STREAMS: MatchedStream[] = [
  {
    id: "stream-evo-sf6",
    streamName: "evo",
    displayName: "EVO_Official",
    title: "EVO 2026 — Street Fighter 6 Grand Finals",
    gameId: "518605",
    gameName: "Street Fighter 6",
    viewerCount: 42000,
    startedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    thumbnailUrl: "https://static-cdn.jtvnw.net/previews-ttv/live_user_evo-{width}x{height}.jpg",
    isMature: false,
    streamType: "tournament",
    priority: "headline",
    stageName: "Grand Finals",
    bracketUrl: "https://start.gg/tournament/evo-2026",
    matchedEvent: {
      eventId: "evo-2026",
      eventName: "EVO 2026",
      eventSlug: "evo-2026",
      startggSlug: "tournament/evo-2026",
      matchSource: "channel_registry",
      confidence: 1.0,
    },
  },
  {
    id: "stream-t8-pools",
    streamName: "evo2",
    displayName: "Evo2",
    title: "EVO 2026 — Tekken 8 Pools",
    gameId: "1811568203",
    gameName: "Tekken 8",
    viewerCount: 18500,
    startedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    thumbnailUrl: "https://static-cdn.jtvnw.net/previews-ttv/live_user_evo2-{width}x{height}.jpg",
    isMature: false,
    streamType: "tournament",
    priority: "featured",
    stageName: "Pools Day 1",
    bracketUrl: "https://start.gg/tournament/evo-2026",
    matchedEvent: {
      eventId: "evo-2026",
      eventName: "EVO 2026",
      eventSlug: "evo-2026",
      startggSlug: "tournament/evo-2026",
      matchSource: "channel_registry",
      confidence: 0.95,
    },
  },
  {
    id: "stream-casual-sf6",
    streamName: "punkdagod",
    displayName: "PunkDaGod",
    title: "Ranked Master grind | SF6 chill stream",
    gameId: "518605",
    gameName: "Street Fighter 6",
    viewerCount: 3500,
    startedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    thumbnailUrl:
      "https://static-cdn.jtvnw.net/previews-ttv/live_user_punkdagod-{width}x{height}.jpg",
    isMature: false,
    streamType: "casual",
    priority: "normal",
    matchedEvent: null,
  },
  {
    id: "stream-casual-uni2",
    streamName: "leffen",
    displayName: "Leffen",
    title: "UNI2 practice and online lobbies",
    gameId: "973167198",
    gameName: "Under Night In-Birth II Sys:Celes",
    viewerCount: 1200,
    startedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    thumbnailUrl: "https://static-cdn.jtvnw.net/previews-ttv/live_user_leffen-{width}x{height}.jpg",
    isMature: false,
    streamType: "casual",
    priority: "normal",
    matchedEvent: null,
  },
];

export async function mockLiveStreams(page: Page, streams: MatchedStream[] = FIXTURE_STREAMS) {
  await page.route("**/api/live-streams", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "public, max-age=30",
      },
      body: JSON.stringify(streams),
    });
  });
}
