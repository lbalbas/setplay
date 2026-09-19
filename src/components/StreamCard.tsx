import { Play, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { MatchedStream } from "#/server/matching";

interface StreamCardProps {
  stream: MatchedStream;
  onClick?: () => void;
}

export default function StreamCard({ stream, onClick }: StreamCardProps) {
  const formatViewers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <article
      onClick={onClick}
      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent hover:shadow-[0_8px_30px_rgba(255,242,130,0.06)]"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-base">
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(255,242,130,0.03)_0%,transparent_70%)]">
          <div className="font-serif text-3xl font-bold tracking-wider text-copy-secondary/20">
            {stream.gameName
              .split(" ")
              .map((w) => w[0])
              .join("")}
          </div>
        </div>

        <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold tracking-wider text-accent uppercase backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            LIVE
          </span>

          {stream.streamType === "tournament" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent uppercase backdrop-blur-sm">
              <Trophy className="h-2.5 w-2.5" />
              Tournament
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-2.5 right-2.5 z-10">
        <span className="inline-flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-copy-primary backdrop-blur-sm">
          {formatViewers(stream.viewerCount)}
        </span>
      </div>

      <div className="flex grow flex-col p-4">
        <h3 className="mb-2 line-clamp-2 text-sm leading-snug font-bold tracking-tight text-copy-primary transition-colors duration-200 group-hover:text-accent">
          {stream.title}
        </h3>

        <div className="mt-auto flex flex-col gap-0.5 text-xs text-copy-secondary">
          <p className="font-semibold text-copy-primary/80">{stream.displayName}</p>
          <p>{stream.gameName}</p>
        </div>

        {
          //stream.title && (
          //<div className="mt-3 rounded border border-accent/10 bg-accent/5 px-2 py-1.5 text-[11px] font-medium text-accent">
          //  {stream.title}
          // </div>
          // )
        }
      </div>

      <div className="px-4 pt-0 pb-4">
        <Link to="/watch/$streamName" params={{ streamName: stream.id }}>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-line bg-surface py-2 text-xs font-bold text-copy-secondary transition-all duration-200 group-hover:border-accent group-hover:bg-accent/10 group-hover:text-accent"
          >
            <Play className="h-3 w-3 fill-current" />
            WATCH NOW
          </button>
        </Link>
      </div>
    </article>
  );
}
