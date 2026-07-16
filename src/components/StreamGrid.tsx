import { MOCK_STREAMS } from "#/mocks/data";
import StreamCard from "./StreamCard";

export default function StreamGrid() {
  const tournamentStreams = MOCK_STREAMS.filter(s => s.type === "tournament");
  const generalStreams    = MOCK_STREAMS.filter(s => s.type !== "tournament");

  return (
    <section className="flex flex-col gap-8">

      {/* --- Pinned Tournaments --- */}
      <div>
        <h2 className="mb-4 font-serif text-lg font-bold text-copy-primary">
          🏆 Pinned Tournaments
        </h2>
        {/* 1 col on mobile → 2 on tablet → 3 on desktop */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournamentStreams.map(stream => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      </div>

      {/* --- General Streams --- */}
      <div>
        <h2 className="mb-4 font-serif text-lg font-bold text-copy-primary">
          Live Now
        </h2>
        {/* 1 col → 2 → 3 → 4 on xl screens */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {generalStreams.map(stream => (
            <StreamCard key={stream.id} stream={stream} />
          ))}
        </div>
      </div>

    </section>
  );
}
