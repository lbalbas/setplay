import { useState } from "react";
import { MOCK_STREAMS, MOCK_GAMES } from "#/mocks/data";
import GameFilterBar from "./GameFilterBar";
import StreamCard from "./StreamCard";

export default function StreamGrid() {
  const [filteredGames, setFilteredGames] = useState(MOCK_GAMES.map((g) => g.name));
  const tournamentStreams = MOCK_STREAMS.filter((s) => s.type === "tournament");
  const generalStreams = MOCK_STREAMS.filter((s) => s.type !== "tournament");

  const handleFilter = (games: typeof MOCK_GAMES) => {
    setFilteredGames(games.map((g) => g.name));
  };

  return (
    <section className="flex flex-col gap-8">
      {/* --- Pinned Tournaments --- */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="shrink-0 whitespace-nowrap font-serif text-lg font-bold text-copy-primary">
            🏆 Pinned Tournaments
          </h2>
          <GameFilterBar onFilter={handleFilter} initialGames={MOCK_GAMES} />
        </div>
        {/* 1 col on mobile → 2 on tablet → 3 on desktop */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournamentStreams.map(
            (stream) =>
              filteredGames.includes(stream.gameName) && (
                <StreamCard key={stream.id} stream={stream} />
              ),
          )}
        </div>
      </div>

      {/* --- General Streams --- */}
      <div>
        <h2 className="mb-4 font-serif text-lg font-bold text-copy-primary">Live Now</h2>
        {/* 1 col → 2 → 3 → 4 on xl screens */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {generalStreams.map(
            (stream) =>
              filteredGames.includes(stream.gameName) && (
                <StreamCard key={stream.id} stream={stream} />
              ),
          )}
        </div>
      </div>
    </section>
  );
}
