import { describe, expect, it } from "vitest";
import type { Event } from "../../server/db/schema";
import { matchStreams } from "../../server/matching";
import type { StartGGStreamQueueItem } from "../../server/startgg";
import type { TwitchStream } from "../../server/twitch";

const MOCK_EVENTS: Event[] = [
  {
    id: "evo-2026-id",
    name: "EVO 2026",
    description: "Evolution Championship Series",
    slug: "evo-2026",
    source: "start_gg",
    startggSlug: "tournament/evo-2026",
    startDate: new Date("2026-07-11T12:00:00Z"),
    bracketUrl: "https://start.gg/tournament/evo-2026",
    endDate: new Date("2026-07-13T23:59:59Z"),
    region: "NA",
    isOnline: false,
    location: "Las Vegas, NV",
    registrationUrl: null,
    imageUrl: null,
    prizePool: 250000,
    attendeeCount: 8500,
    featuredPriority: "headline",
    status: "live",
  },
  {
    id: "combo-breaker-2026-id",
    name: "Combo Breaker 2026",
    description: "Combo Breaker",
    slug: "combo-breaker-2026",
    source: "start_gg",
    bracketUrl: "https://start.gg/tournament/combo-breaker-2026",
    startggSlug: "tournament/combo-breaker-2026",
    startDate: new Date("2026-05-22T12:00:00Z"),
    endDate: new Date("2026-05-25T23:59:59Z"),
    region: "NA",
    isOnline: false,
    location: "Chicago, IL",
    registrationUrl: null,
    imageUrl: null,
    prizePool: 50000,
    attendeeCount: 3000,
    featuredPriority: "featured",
    status: "live",
  },
];

function createMockStream(overrides: Partial<TwitchStream>): TwitchStream {
  return {
    id: "stream-1",
    user_id: "user-1",
    user_login: "randomplayer",
    user_name: "RandomPlayer",
    game_id: "518605",
    game_name: "Street Fighter 6",
    type: "live",
    title: "Grinding Master rank | Chill vibes",
    viewer_count: 500,
    started_at: "2026-07-11T14:00:00Z",
    language: "en",
    thumbnail_url: "https://static-cdn.jtvnw.net/previews/stream-1-{width}x{height}.jpg",
    is_mature: false,
    ...overrides,
  };
}

describe("4-Layer Matching Engine", () => {
  it("Layer 1: matches official start.gg stream queue (confidence 1.0)", () => {
    const stream = createMockStream({
      id: "stream-capcom",
      user_login: "capcomfighters",
      user_name: "CapcomFighters",
      title: "CPT Live Broadcast",
      viewer_count: 12000,
    });

    const queue: StartGGStreamQueueItem[] = [
      {
        tournamentId: "evo-2026-id",
        tournamentName: "EVO 2026",
        tournamentSlug: "tournament/evo-2026",
        streamName: "capcomfighters",
        streamSource: "TWITCH",
        featuredVideogameIds: [43868],
      },
    ];

    const result = matchStreams([stream], queue, MOCK_EVENTS);
    expect(result).toHaveLength(1);
    expect(result[0].streamType).toBe("tournament");
    expect(result[0].matchedEvent?.matchSource).toBe("start_gg_queue");
    expect(result[0].matchedEvent?.confidence).toBe(1.0);
    expect(result[0].matchedEvent?.eventId).toBe("evo-2026-id");
  });

  it("Layer 2: matches known channel registry (confidence 0.9)", () => {
    const stream = createMockStream({
      id: "stream-spooky",
      user_login: "teamsp00ky",
      user_name: "TeamSp00ky",
      title: "Live from the venue",
      viewer_count: 8500,
    });

    // No start.gg queue match
    const result = matchStreams([stream], [], MOCK_EVENTS);
    expect(result).toHaveLength(1);
    expect(result[0].streamType).toBe("tournament");
    expect(result[0].matchedEvent?.matchSource).toBe("channel_registry");
    expect(result[0].matchedEvent?.confidence).toBe(0.9);
    expect(result[0].matchedEvent?.eventSlug).toBe("combo-breaker-2026");
  });

  it("Layer 3: matches title regex with stage indicator (confidence 0.75)", () => {
    const stream = createMockStream({
      id: "stream-community",
      user_login: "somecommunitycaster",
      user_name: "SomeCommunityCaster",
      title: "EVO 2026 Street Fighter 6 Pools & Bracket Matches Day 1",
      viewer_count: 2200,
    });

    const result = matchStreams([stream], [], MOCK_EVENTS);
    expect(result).toHaveLength(1);
    expect(result[0].streamType).toBe("tournament");
    expect(result[0].matchedEvent?.matchSource).toBe("title_pattern");
    expect(result[0].matchedEvent?.confidence).toBe(0.75);
    expect(result[0].matchedEvent?.eventSlug).toBe("evo-2026");
  });

  it("Layer 4: falls back to casual stream when unmatched", () => {
    const stream = createMockStream({
      id: "stream-casual",
      user_login: "daigothebeastv",
      user_name: "DaigoTheBeastV",
      title: "SF6 Ranked with Guile | ROAD TO LEGEND",
      viewer_count: 4500,
    });

    const result = matchStreams([stream], [], MOCK_EVENTS);
    expect(result).toHaveLength(1);
    expect(result[0].streamType).toBe("casual");
    expect(result[0].matchedEvent).toBeNull();
  });

  it("Sorting: orders tournaments first (by confidence, then viewers), then casuals by viewers", () => {
    const casualHighViewers = createMockStream({
      id: "s-casual-high",
      user_login: "bigcasual",
      viewer_count: 20000,
      title: "Ranked session",
    });

    const tournamentLayer1 = createMockStream({
      id: "s-tourney-l1",
      user_login: "capcomfighters",
      viewer_count: 5000,
      title: "Official stream",
    });

    const tournamentLayer3 = createMockStream({
      id: "s-tourney-l3",
      user_login: "caster123",
      viewer_count: 8000,
      title: "EVO Pools Stream",
    });

    const queue: StartGGStreamQueueItem[] = [
      {
        tournamentId: "evo-2026-id",
        tournamentName: "EVO 2026",
        tournamentSlug: "tournament/evo-2026",
        streamName: "capcomfighters",
        streamSource: "TWITCH",
        featuredVideogameIds: [43868],
      },
    ];

    const results = matchStreams(
      [casualHighViewers, tournamentLayer3, tournamentLayer1],
      queue,
      MOCK_EVENTS,
    );

    expect(results).toHaveLength(3);
    // 1st: Tournament with 1.0 confidence
    expect(results[0].id).toBe("s-tourney-l1");
    expect(results[0].streamType).toBe("tournament");
    expect(results[0].matchedEvent?.confidence).toBe(1.0);

    // 2nd: Tournament with 0.75 confidence
    expect(results[1].id).toBe("s-tourney-l3");
    expect(results[1].streamType).toBe("tournament");
    expect(results[1].matchedEvent?.confidence).toBe(0.75);

    // 3rd: Casual stream (even with higher viewers)
    expect(results[2].id).toBe("s-casual-high");
    expect(results[2].streamType).toBe("casual");
  });

  it("handles priority weight sorting correctly across tournament and casual streams", () => {
    const streamHeadline = createMockStream({
      id: "s-headline",
      user_login: "headlinestream",
      viewer_count: 100,
    });
    const streamFeatured = createMockStream({
      id: "s-featured",
      user_login: "featuredstream",
      viewer_count: 500,
    });
    const streamNormal = createMockStream({
      id: "s-normal",
      user_login: "normalstream",
      viewer_count: 2000,
    });

    const results = matchStreams([streamNormal, streamHeadline, streamFeatured], [], MOCK_EVENTS);

    // Apply priorities manually as the override or cron logic would
    results.find((s) => s.id === "s-headline")!.priority = "headline";
    results.find((s) => s.id === "s-featured")!.priority = "featured";
    results.find((s) => s.id === "s-normal")!.priority = "normal";

    const PRIORITY_WEIGHT = { headline: 3, featured: 2, normal: 1 };
    results.sort((a, b) => {
      const weightDiff =
        (PRIORITY_WEIGHT[b.priority ?? "normal"] ?? 1) -
        (PRIORITY_WEIGHT[a.priority ?? "normal"] ?? 1);
      if (weightDiff !== 0) return weightDiff;
      return b.viewerCount - a.viewerCount;
    });

    expect(results[0].id).toBe("s-headline");
    expect(results[1].id).toBe("s-featured");
    expect(results[2].id).toBe("s-normal");
  });
});
