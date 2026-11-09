import { describe, expect, it } from "vitest";
import { resolveStream } from "../../routes/watch.$streamName";
import type { MatchedStream } from "../../server/matching";

describe("resolveStream Utility", () => {
  const mockLiveStreams: MatchedStream[] = [
    {
      id: "live-101",
      streamName: "capcomfighters",
      displayName: "CapcomFighters",
      title: "Capcom Cup Finals Top 8",
      gameId: "518605",
      gameName: "Street Fighter 6",
      viewerCount: 45000,
      startedAt: "2026-11-09T18:00:00Z",
      language: "en",
      thumbnailUrl: "https://example.com/thumb.jpg",
      isMature: false,
      streamType: "tournament",
      priority: "headline",
      matchedEvent: {
        eventId: "capcom-cup-2026",
        eventName: "Capcom Cup 2026",
        eventSlug: "capcom-cup-2026",
        startggSlug: "tournament/capcom-cup-2026",
        matchSource: "channel_registry",
        confidence: 1.0,
      },
    },
    {
      id: "live-102",
      streamName: "spooky",
      displayName: "TeamSpooky",
      title: "Casual Sunday Fights",
      gameId: "518605",
      gameName: "Street Fighter 6",
      viewerCount: 2200,
      startedAt: "2026-11-09T19:00:00Z",
      language: "en",
      thumbnailUrl: "https://example.com/thumb2.jpg",
      isMature: false,
      streamType: "casual",
      priority: "normal",
      matchedEvent: null,
    },
  ];

  it("resolves stream by exact stream ID from live list", () => {
    const resolved = resolveStream("live-101", mockLiveStreams);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe("live-101");
    expect(resolved?.displayName).toBe("CapcomFighters");
    expect(resolved?.eventName).toBe("Capcom Cup 2026");
    expect(resolved?.priority).toBe("Headline");
    expect(resolved?.isLive).toBe(true);
  });

  it("resolves stream by user_login handle case-insensitively", () => {
    const resolved = resolveStream("CapcomFighters", mockLiveStreams);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe("live-101");
    expect(resolved?.channel).toBe("capcomfighters");
  });

  it("resolves casual live stream without tournament metadata", () => {
    const resolved = resolveStream("spooky", mockLiveStreams);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe("live-102");
    expect(resolved?.priority).toBe("Standard");
    expect(resolved?.eventId).toBeNull();
  });

  it("falls back to mock data when stream is offline or not in live list", () => {
    const resolved = resolveStream("str_1", []);
    expect(resolved).not.toBeNull();
    expect(resolved?.id).toBe("str_1");
    expect(resolved?.isLive).toBe(false);
  });

  it("returns null when stream is completely unknown and not in mock data", () => {
    const resolved = resolveStream("non_existent_stream_xyz_999", mockLiveStreams);
    expect(resolved).toBeNull();
  });

  it("returns null for empty or undefined stream identifier", () => {
    expect(resolveStream(undefined, mockLiveStreams)).toBeNull();
    expect(resolveStream("", mockLiveStreams)).toBeNull();
  });
});
