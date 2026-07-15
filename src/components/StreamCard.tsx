import { type MockStream } from "#/mocks/data";
import { Play, Trophy } from 'lucide-react'

interface StreamCardProps {
  stream: MockStream;
  onClick?: () => void;
}

export default function StreamCard({stream, onClick}: StreamCardProps) {
  const formatViewers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString();
  }

  return (
    <article
      onClick={onClick}
      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_8px_30px_rgba(255,242,130,0.06)] cursor-pointer"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-base">
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,242,130,0.03)_0%,transparent_70%)]">
          <div className="text-copy-secondary/20 font-serif text-3xl font-bold tracking-wider">
            {stream.gameName.split(" ").map(w => w[0]).join("")}
          </div>
        </div>

        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-accent tracking-wider uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"/>
              LIVE
          </span>

          {stream.type === "tournament" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/25 backdrop-blur-sm px-2 py-0.5 text-[10px] font-bold text-accent uppercase">
              <Trophy className="h-2.5 w-2.5" />
              Tournament
            </span>
          )}
        </div>
      </div>

      <div className="absolute right-2.5 top-2.5 z-10">
        <span className="inline-flex items-center gap-1 rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-copy-primary">
          {formatViewers(stream.viewerCount)}
        </span>
      </div>

      <div className="flex flex-col grow p-4">
        <h3 className="line-clamp-2 text-sm font-bold text-copy-primary leading-snug tracking-tight mb-2 group-hover:text-accent transition-colors duration-200">
          {stream.title}
        </h3>

        <div className="flex flex-col gap-0.5 text-xs text-copy-secondary mt-auto">
          <p className="font-semibold text-copy-primary/80">{stream.displayName}</p>
          <p>{stream.gameName}</p>
        </div>

        {stream.matchMetadata && (
          <div className="mt-3 rounded bg-accent/5 border border-accent/10 px-2 py-1.5 text-[11px] text-accent font-medium">
            {stream.matchMetadata}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-0">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 rounded-full border border-line bg-surface py-2 text-xs font-bold text-copy-secondary transition-all duration-200 group-hover:border-accent group-hover:bg-accent/10 group-hover:text-accent">
          <Play className="h-3 w-3 fill-current" />
          WATCH NOW
        </button>
      </div>
    </article>
  )
}
