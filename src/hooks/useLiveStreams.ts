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
  return useQuery<MatchedStream[]>({
    queryKey: ["live-streams"],
    queryFn: fetchLiveStreams,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
