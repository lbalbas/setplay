import { describe, expect, it, vi } from "vitest";
import {
  StartGGStreamQueueResponseSchema,
  StartGGTournamentCalendarResponseSchema,
  fetchUpcomingTournaments,
} from "../../server/startgg";
import type { Env } from "../../server/db";

describe("start.gg Module", () => {
  it("validates stream queue GraphQL response with Zod", () => {
    const mockPayload = {
      data: {
        tournaments: {
          nodes: [
            {
              id: 12345,
              name: "Combo Breaker 2026",
              slug: "tournament/combo-breaker-2026",
              events: [
                {
                  id: 999,
                  name: "Street Fighter 6",
                  videogame: { id: 43868 },
                },
              ],
              streams: [
                {
                  id: 101,
                  streamName: "CapcomFighters ",
                  streamSource: "TWITCH",
                },
              ],
            },
          ],
        },
      },
    };

    const parsed = StartGGStreamQueueResponseSchema.parse(mockPayload);
    expect(parsed.data.tournaments?.nodes).toHaveLength(1);
    const node = parsed.data.tournaments?.nodes?.[0];
    expect(node?.name).toBe("Combo Breaker 2026");
    expect(node?.streams?.[0].streamName).toBe("CapcomFighters ");
  });

  it("validates tournament calendar GraphQL response with Zod", () => {
    const mockPayload = {
      data: {
        tournaments: {
          nodes: [
            {
              id: 54321,
              name: "EVO 2026",
              slug: "tournament/evo-2026",
              startAt: 1785000000,
              endAt: 1785200000,
              isOnline: false,
              city: "Las Vegas",
              addrState: "NV",
              countryCode: "US",
              numAttendees: 12000,
              images: [
                {
                  type: "banner",
                  url: "https://images.start.gg/banner.png",
                },
              ],
              events: [
                {
                  id: 888,
                  name: "Tekken 8",
                  videogame: { id: 49783 },
                },
              ],
            },
          ],
        },
      },
    };

    const parsed = StartGGTournamentCalendarResponseSchema.parse(mockPayload);
    expect(parsed.data.tournaments?.nodes).toHaveLength(1);
    const node = parsed.data.tournaments?.nodes?.[0];
    expect(node?.name).toBe("EVO 2026");
    expect(node?.city).toBe("Las Vegas");
    expect(node?.images?.[0].url).toBe("https://images.start.gg/banner.png");
  });

  it("filters out tournaments starting after beforeDate cutoff in fetchUpcomingTournaments", async () => {
    const nowSec = 1750000000;
    const withinWindowSec = nowSec + 30 * 86400; // 30 days from now
    const farFutureSec = nowSec + 400 * 86400; // 400 days from now (> 12 months)

    const mockResponse = {
      data: {
        tournaments: {
          nodes: [
            {
              id: 1,
              name: "Valid Tournament",
              slug: "tournament/valid",
              startAt: withinWindowSec,
              endAt: withinWindowSec + 86400,
              isOnline: true,
              events: [{ id: 10, name: "SF6", videogame: { id: 43868 } }],
            },
            {
              id: 2,
              name: "Far Future Dud Tournament",
              slug: "tournament/dud",
              startAt: farFutureSec,
              endAt: farFutureSec + 86400,
              isOnline: true,
              events: [{ id: 11, name: "SF6", videogame: { id: 43868 } }],
            },
          ],
        },
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response);

    const mockEnv = {
      STARTGG_API_TOKEN: "mock-token",
    } as unknown as Env;

    const tournaments = await fetchUpcomingTournaments(
      mockEnv,
      [43868],
      nowSec - 86400,
      nowSec + 365 * 86400,
      1, // 1 page
    );

    expect(tournaments).toHaveLength(1);
    expect(tournaments[0].name).toBe("Valid Tournament");

    // Also verify that beforeDate was passed into query variables
    const calledBody = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(calledBody.variables.beforeDate).toBe(nowSec + 365 * 86400);

    fetchSpy.mockRestore();
  });
});
