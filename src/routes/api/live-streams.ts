import { createFileRoute } from "@tanstack/react-router";
import type { Env } from "../../server/db";
import { MOCK_STREAMS } from "../../mocks/data";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/live-streams")({
  server: {
    handlers: {
      OPTIONS: async () => {
        return new Response(null, { headers: CORS_HEADERS });
      },
      GET: async ({ context }) => {
        const { env } = (context as unknown as { env?: Env }) ?? {};

        // Fallback for plain `pnpm dev` (Vite dev server without Cloudflare bindings)
        if (!env?.KV) {
          console.warn(
            "[/api/live-streams] KV not available (running in pure Vite dev). Serving fallback data.",
          );
          return Response.json([...MOCK_STREAMS], {
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          });
        }

        const rawData = await env.KV.get("live_streams");

        if (!rawData) {
          return Response.json([], {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
              "CDN-Cache-Control": "max-age=55",
              ...CORS_HEADERS,
            },
          });
        }

        try {
          const streams = JSON.parse(rawData);
          return Response.json(streams, {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
              "CDN-Cache-Control": "max-age=55",
              ...CORS_HEADERS,
            },
          });
        } catch (err) {
          console.error("[/api/live-streams] Corrupt JSON in KV:", err);
          return Response.json([], {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
              ...CORS_HEADERS,
            },
          });
        }
      },
    },
  },
});
