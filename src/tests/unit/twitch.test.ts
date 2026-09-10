import { describe, expect, it } from "vitest";
import { TwitchStreamsResponseSchema } from "../../server/twitch";

describe("Twitch Module", () => {
  it("validates Twitch streams payload with Zod", () => {
    const mockPayload = {
      data: [
        {
          id: "123456",
          user_id: "7890",
          user_login: "capcomfighters",
          user_name: "CapcomFighters",
          game_id: "518605",
          game_name: "Street Fighter 6",
          type: "live",
          title: "Capcom Pro Tour Top 8",
          viewer_count: 15200,
          started_at: "2026-09-10T12:00:00Z",
          language: "en",
          thumbnail_url:
            "https://static-cdn.jtvnw.net/previews-ttv/live_user_capcomfighters-{width}x{height}.jpg",
          is_mature: false,
        },
      ],
    };

    const parsed = TwitchStreamsResponseSchema.parse(mockPayload);
    expect(parsed.data).toHaveLength(1);
    expect(parsed.data[0].user_login).toBe("capcomfighters");
  });
});
