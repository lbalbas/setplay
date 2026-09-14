import { describe, expect, it } from "vitest";
import {
  StartGGStreamQueueResponseSchema,
  StartGGTournamentCalendarResponseSchema,
} from "../../server/startgg";

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
});
