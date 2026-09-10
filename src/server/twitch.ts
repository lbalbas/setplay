import { z } from "zod";
import type { Env } from "./db";

// ---------------------------------------------------------------------------
// 1. Zod Validation Schemas
// ---------------------------------------------------------------------------

/**
 * Validates the Twitch OAuth 2.0 Client Credentials token response.
 */
export const TwitchAuthTokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
});

/**
 * Validates an individual stream object returned by Twitch Helix GET /streams.
 */
export const TwitchStreamSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  user_login: z.string(), // Channel username (e.g. "capcomfighters")
  user_name: z.string(), // Display name (e.g. "CapcomFighters")
  game_id: z.string(), // Twitch Game ID (e.g. "518605" for SF6)
  game_name: z.string(),
  type: z.literal("live").or(z.string()),
  title: z.string(),
  viewer_count: z.number(),
  started_at: z.string(),
  language: z.string(),
  thumbnail_url: z.string(), // Template URL e.g. "...-{width}x{height}.jpg"
  is_mature: z.boolean(),
});

/**
 * Validates the root array response from Twitch Helix GET /streams.
 */
export const TwitchStreamsResponseSchema = z.object({
  data: z.array(TwitchStreamSchema),
  pagination: z
    .object({
      cursor: z.string().optional(),
    })
    .optional(),
});

// Inferred TypeScript Types
export type TwitchAuthTokenResponse = z.infer<typeof TwitchAuthTokenResponseSchema>;
export type TwitchStream = z.infer<typeof TwitchStreamSchema>;
export type TwitchStreamsResponse = z.infer<typeof TwitchStreamsResponseSchema>;

// ---------------------------------------------------------------------------
// 2. Token Management with Cloudflare KV Caching
// ---------------------------------------------------------------------------

/**
 * Retrieves a valid Twitch Access Token.
 * Checks Cloudflare KV first; if expired or absent, requests a new token
 * via OAuth Client Credentials flow and caches it in KV with a safety TTL buffer.
 */
export async function getTwitchAccessToken(env: Env): Promise<string> {
  const KV_KEY = "twitch_token";

  // 1. Check hot KV cache
  const cachedToken = await env.KV.get(KV_KEY);
  if (cachedToken) {
    return cachedToken;
  }

  // 2. Cache miss: Request new token from Twitch OAuth
  const params = new URLSearchParams({
    client_id: env.TWITCH_CLIENT_ID,
    client_secret: env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to obtain Twitch access token (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const parsed = TwitchAuthTokenResponseSchema.parse(json);

  // 3. Cache token in Cloudflare KV
  // Subtract 300 seconds (5 minutes) from expires_in as a safety buffer
  const ttlInSeconds = Math.max(parsed.expires_in - 300, 60);
  await env.KV.put(KV_KEY, parsed.access_token, {
    expirationTtl: ttlInSeconds,
  });

  return parsed.access_token;
}

// ---------------------------------------------------------------------------
// 3. Twitch Helix API Client Functions
// ---------------------------------------------------------------------------

/**
 * Fetches active live streams for the provided list of Twitch Game IDs.
 * Twitch Helix accepts up to 100 game_id query params per request.
 *
 * @param env Worker environment bindings (KV & Secrets)
 * @param gameIds Array of Twitch Game IDs (e.g. ["518605", "516766"])
 * @returns Array of validated TwitchStream objects
 */
export async function fetchLiveStreamsByGame(env: Env, gameIds: string[]): Promise<TwitchStream[]> {
  if (gameIds.length === 0) {
    return [];
  }

  const token = await getTwitchAccessToken(env);

  // Build URL with multiple game_id query parameters
  const url = new URL("https://api.twitch.tv/helix/streams");
  url.searchParams.set("first", "100"); // Maximum page size allowed by Twitch
  url.searchParams.set("type", "live");

  for (const gameId of gameIds) {
    url.searchParams.append("game_id", gameId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Client-ID": env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twitch API request failed (${response.status}): ${errorText}`);
  }

  const json = await response.json();

  // Validate raw Twitch payload against Zod schema
  const parsed = TwitchStreamsResponseSchema.parse(json);

  return parsed.data;
}
