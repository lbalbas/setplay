import { useState } from "react";
import { useLoaderData } from "@tanstack/react-router";
import StreamCard from "./StreamCard";
import { TrendingUp, Trophy } from "lucide-react";
import { useGameFilter } from "#/context/GameFilterContext";
import { useLiveStreams } from "#/hooks/useLiveStreams";
import type { MatchedStream } from "#/server/matching";
import type { Game } from "#/server/db/schema";

interface StreamGridProps {
  selectedGame?: string;
}

const STREAM_TYPE_FILTERS = [
  { id: "all", label: "All" },
  { id: "tournament", label: "Tournament" },
  { id: "ranked", label: "Ranked" },
  { id: "casual", label: "Casual" },
  { id: "pro_play", label: "Pro Play" },
];

export default function StreamGrid({ selectedGame: propSelectedGame }: StreamGridProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const { selectedGame: contextSelectedGame } = useGameFilter();
  const selectedGame = propSelectedGame ?? contextSelectedGame;
  const streams = useLiveStreams().data;
  const rootGames = useLoaderData({ from: "__root__" }) as Game[];

  if (!streams) return null;

  // Helper to match game selection against DB games and live Twitch stream metadata
  const isGameMatch = (stream: MatchedStream) => {
    if (selectedGame === "all") return true;

    const activeGame = rootGames?.find((g) => g.id === selectedGame || g.slug === selectedGame);

    if (activeGame) {
      return stream.gameId === activeGame.id || stream.gameName === activeGame.name;
    }

    return (
      stream.gameId === selectedGame || stream.gameName.toLowerCase() === selectedGame.toLowerCase()
    );
  };

  // Filter streams by selected game
  const gameFilteredStreams = streams.filter(isGameMatch);

  // Filter streams by stream type
  const typeFilteredStreams = gameFilteredStreams.filter((stream) => {
    if (selectedType === "all") return true;
    return stream.streamType === selectedType;
  });

  // Separate pinned tournaments vs other streams when viewing "all" types
  const pinnedTournaments = typeFilteredStreams.filter((s) => s.streamType === "tournament");
  const allOtherStreams =
    selectedType === "all"
      ? typeFilteredStreams.filter((s) => s.streamType !== "tournament")
      : typeFilteredStreams;

  const showPinnedSection =
    (selectedType === "all" || selectedType === "tournament") && pinnedTournaments.length > 0;
  const showAllStreamsSection =
    (selectedType === "all" && allOtherStreams.length > 0) ||
    (selectedType !== "all" && selectedType !== "tournament" && typeFilteredStreams.length > 0);

  return (
    <section className="flex flex-col gap-6">
      {/* StreamGrid Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        {/* Title with Icon */}
        <div className="flex items-center gap-2.5">
          <TrendingUp aria-hidden="true" className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-2xl font-bold tracking-tight text-white">Live Streams</h2>
        </div>

        {/* Stream Type Filter Pills */}
        <div
          role="group"
          aria-label="Stream type filters"
          className="flex scrollbar-none items-center gap-2 overflow-x-auto py-1"
        >
          {STREAM_TYPE_FILTERS.map((filter) => {
            const isSelected = selectedType === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setSelectedType(filter.id)}
                aria-pressed={isSelected}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isSelected
                    ? "bg-accent text-black shadow-sm"
                    : "border border-[#2a2a22] bg-[#181814] text-[#a0a095] hover:bg-[#22221c] hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- Section 1: Pinned Tournaments --- */}
      {showPinnedSection && (
        <div className="flex flex-col gap-4">
          {/* Section Separator */}
          <div className="my-2 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/50 bg-[#161611] px-3.5 py-1 text-xs font-extrabold tracking-wider text-accent uppercase shadow-sm">
              <Trophy aria-hidden="true" className="h-3.5 w-3.5" /> PINNED TOURNAMENTS
            </span>
            <div className="h-px flex-1 bg-[#24241d]" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedTournaments.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      )}

      {/* --- Section 2: All Streams / General Streams --- */}
      {showAllStreamsSection && (
        <div className="flex flex-col gap-4">
          {/* Section Separator */}
          <div className="my-2 flex items-center gap-3">
            <span className="text-xs font-extrabold tracking-widest text-[#757568] uppercase">
              ALL STREAMS
            </span>
            <div className="h-px flex-1 bg-[#24241d]" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {allOtherStreams.map((stream) => (
              <StreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!showPinnedSection && !showAllStreamsSection && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#262620] bg-[#12120f]/50 py-16 text-center">
          <p className="font-semibold text-base">No live streams found</p>
          <p className="mt-1 text-xs text-[#8a8a7c]">
            Try selecting a different game or stream type filter above.
          </p>
        </div>
      )}
    </section>
  );
}
