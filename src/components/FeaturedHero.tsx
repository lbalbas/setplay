import { Play, Trophy, ExternalLink } from "lucide-react";
import { useLiveStreams } from "#/hooks/useLiveStreams";
import { getTwitchThumbnail } from "#/utils/formatThumbnail";
import { Link } from "@tanstack/react-router";

export default function FeaturedHero() {
  const streams = useLiveStreams().data ?? [];
  // Priority: first matched tournament stream, otherwise the stream with highest viewer count
  const headlineStream =
    streams.find((s) => s.priority === "headline") ||
    streams.find((s) => s.streamType === "tournament") ||
    streams[0] ||
    null;
  if (!headlineStream) return null;

  const thumbnailUrl = getTwitchThumbnail(headlineStream.thumbnailUrl, 1280, 720);

  // Calculate the duration of the stream in seconds based on startedAt and returns formatted string Xh Ym
  const calculateDuration = (startedAt: string) => {
    const now = new Date();
    const started = new Date(startedAt);
    const duration = (now.getTime() - started.getTime()) / 1000;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
      {/* LEFT: Player Panel */}
      <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-base transition-all duration-300 hover:border-accent/40 hover:shadow-[0_0_40px_rgba(255,242,130,0.05)]">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={headlineStream.title}
            className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {/* Placeholder gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,242,130,0.03),transparent_60%)]" />

        {/* Centered Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            aria-label="Play headline stream"
            className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-black/60 text-accent backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:border-accent hover:bg-accent/10"
          >
            <Play aria-hidden="true" className="h-7 w-7 translate-x-0.5 fill-current" />
          </button>
        </div>

        {/* Live badge — bottom left */}
        <div className="absolute bottom-3 left-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold tracking-wider text-accent uppercase backdrop-blur-sm">
            <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            LIVE · {(headlineStream.viewerCount / 1000).toFixed(1)}K watching
          </span>
        </div>
      </div>

      {/* RIGHT: Info Panel */}
      <div className="flex flex-col justify-between rounded-xl border border-line bg-surface p-6">
        {/* Top Section */}
        <div className="flex flex-col gap-4">
          {/* Headline Badge */}
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[11px] font-bold tracking-wider text-accent uppercase">
            <Trophy aria-hidden="true" className="h-3 w-3" />
            Headline Event
          </span>

          {/* Title */}
          <h1 className="font-serif text-2xl leading-tight font-bold text-copy-primary lg:text-3xl">
            {headlineStream.title}
          </h1>

          {/* Metadata Rows */}
          <dl className="flex flex-col gap-2 text-sm">
            {[
              ["Channel", headlineStream.displayName],
              ["Game", headlineStream.gameName],
              ["Stage", headlineStream.streamType],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-2">
                <dt className="w-16 shrink-0 text-xs text-copy-secondary">{label}</dt>
                <dd className="font-medium text-copy-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Stats Row */}
        <dl className="my-6 grid grid-cols-3 divide-x divide-line">
          {[
            ["Current Viewers", headlineStream.viewerCount],
            ["Duration", calculateDuration(headlineStream.startedAt)],
            ["Prize Pool", "N/A"],
          ].map(([label, value]) => (
            <div key={label} className="flex flex-col items-center gap-1 px-3 first:pl-0 last:pr-0">
              <dt className="text-[10px] tracking-widest text-copy-secondary uppercase">{label}</dt>
              <dd className="text-lg font-bold text-copy-primary">{value}</dd>
            </div>
          ))}
        </dl>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-2">
          <Link
            params={{ streamName: headlineStream.streamName }}
            to={`/watch/$streamName`}
            className="w-full"
          >
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-accent bg-accent/10 py-3 text-sm font-bold text-accent transition-all duration-200 hover:bg-accent hover:text-base"
            >
              <Play aria-hidden="true" className="h-4 w-4 fill-current" />
              Watch Now
            </button>
          </Link>

          {headlineStream.bracketUrl && (
            <a
              href={headlineStream.bracketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-copy-secondary transition-colors hover:text-copy-primary"
            >
              View Bracket
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
