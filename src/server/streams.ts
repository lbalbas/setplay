import { createServerFn } from "@tanstack/react-start";
import { getWorkerEnv } from "./env";
import type { MatchedStream } from "./matching";

/**
 * Reads the cached live stream list directly from Cloudflare KV.
 * Used by server-side route loaders/beforeLoad hooks that need
 * the stream list without going through the HTTP API endpoint.
 */
export const getLiveStreams = createServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<MatchedStream[]> => {
    const env = await getWorkerEnv(context);

    if (!env?.KV) {
      console.warn("[getLiveStreams] KV binding not found.");
      return [];
    }

    const rawData = await env.KV.get("live_streams");

    if (!rawData) {
      return [];
    }

    try {
      return JSON.parse(rawData) as MatchedStream[];
    } catch (err) {
      console.error("[getLiveStreams] Corrupt JSON in KV:", err);
      return [];
    }
  },
);
