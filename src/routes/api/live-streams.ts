import { createFileRoute } from "@tanstack/react-router";
import type { Env } from "../../server/db";

export const Route = createFileRoute("/api/live-streams")({
  server: {
    handlers: {
      GET: async ({ context }) => {
        const { env } = (context as unknown as { env?: Env }) ?? {};

        if (!env?.KV) {
          return Response.json({ error: "KV binding not available" }, { status: 500 });
        }

        const rawData = await env.KV.get("live_streams");

        if (!rawData) {
          return Response.json([], {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
              "CDN-Cache-Control": "max-age=55",
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
            },
          });
        } catch (err) {
          console.error("[/api/live-streams] Corrupt JSON found in KV:", err);
          // Return empty array fallback if KV data is malformed
          return Response.json([], {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store",
            },
          });
        }
      },
    },
  },
});
