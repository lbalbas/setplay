import { createFileRoute, redirect } from "@tanstack/react-router";
import { getLiveStreams } from "#/server/streams";
import { MOCK_HEADLINE_STREAM } from "#/mocks/data";

export const Route = createFileRoute("/watch/")({
  beforeLoad: async () => {
    try {
      const streams = await getLiveStreams();

      // Pick the highest-viewer stream, preferring tournament streams
      const sorted = [...streams].sort((a, b) => {
        // Tournament streams first
        if (a.streamType === "tournament" && b.streamType !== "tournament") return -1;
        if (a.streamType !== "tournament" && b.streamType === "tournament") return 1;
        // Then by viewer count descending
        return b.viewerCount - a.viewerCount;
      });

      const targetStream = sorted[0];

      if (targetStream?.streamName) {
        throw redirect({
          to: "/watch/$streamName",
          params: { streamName: targetStream.streamName },
        });
      }
    } catch (err) {
      // Re-throw redirects — TanStack Router uses throw-based redirects
      if (err instanceof Response || (err && typeof err === "object" && "to" in err)) {
        throw err;
      }
      console.error("[watch.index] Failed to resolve headline stream:", err);
    }

    // Fallback: KV empty, no live streams, or server function failed
    throw redirect({
      to: "/watch/$streamName",
      params: { streamName: MOCK_HEADLINE_STREAM.id },
    });
  },
});
