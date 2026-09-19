import { useQuery } from "@tanstack/react-query";
import type { MatchedStream } from "#/server/matching";

async function fetchLiveStreams(): Promise<MatchedStream[]> {
  const response = await fetch("/api/live-streams");
  if (!response.ok) {
    throw new Error("Failed to fetch live streams");
  }
  return response.json();
}

export function useLiveStreams() {
  return useQuery({
    queryKey: ["live-streams"],
    queryFn: fetchLiveStreams,
    // Poll every 60 seconds (matches the KV cron cycle)
    refetchInterval: 60 * 1000,
    // Mark data stale after 30 seconds (matches Cache-Control max-age)
    staleTime: 30 * 1000,
    // Keep previously fetched data while refetching in background
    placeholderData: (previousData) => previousData,
  });
}
