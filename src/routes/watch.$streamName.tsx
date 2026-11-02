import { useState, useMemo, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Maximize2,
  Minimize2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Share2,
  Bookmark,
  BookmarkCheck,
  Check,
} from "lucide-react";
import { MOCK_HEADLINE_STREAM, MOCK_STREAMS } from "#/mocks/data";
import type { MatchedStream } from "#/server/matching";
import { useLiveStreams } from "#/hooks/useLiveStreams";
import { useHostName } from "#/hooks/useHostName";

export const Route = createFileRoute("/watch/$streamName")({
  component: WatchView,
});

// ---------------------------------------------------------------------------
// Stream Resolution Helper
// ---------------------------------------------------------------------------
export interface ResolvedStream {
  id: string;
  channel: string; // Twitch login handle needed for iframe embed (e.g. "capcomfighters")
  displayName: string; // Display name for headers (e.g. "CapcomFighters")
  title: string;
  game: string;
  gameId: string;
  viewers: string;
  rawViewerCount: number;
  eventName: string;
  eventId: string | null;
  bracketUrl: string | null;
  priority: "Headline" | "Featured" | "Standard";
  match: string;
  stage: string;
  isLive: boolean;
}

export function resolveStream(
  streamIdentifier?: string,
  liveStreams?: MatchedStream[],
): ResolvedStream | null {
  if (!streamIdentifier) return null;
  const cleanId = decodeURIComponent(streamIdentifier).toLowerCase();
  // 1. Search active live streams from KV/API
  const liveMatch = liveStreams?.find(
    (s) =>
      s.id.toLowerCase() === cleanId ||
      s.streamName.toLowerCase() === cleanId ||
      s.displayName.toLowerCase() === cleanId,
  );
  if (liveMatch) {
    const isHeadline =
      liveMatch.streamType === "tournament" && liveStreams?.[0]?.id === liveMatch.id;
    return {
      id: liveMatch.id,
      channel: liveMatch.streamName, // Key for Twitch embed: ?channel=${channel}
      displayName: liveMatch.displayName,
      title: liveMatch.title,
      game: liveMatch.gameName,
      gameId: liveMatch.gameId,
      viewers: liveMatch.viewerCount.toLocaleString(),
      rawViewerCount: liveMatch.viewerCount,
      eventName: liveMatch.matchedEvent?.eventName ?? "FGC Live Broadcast",
      eventId: liveMatch.matchedEvent?.eventId ?? null,
      bracketUrl:
        liveMatch.bracketUrl ??
        (liveMatch.matchedEvent?.startggSlug
          ? `https://start.gg/${liveMatch.matchedEvent.startggSlug}`
          : null),
      priority: isHeadline
        ? "Headline"
        : liveMatch.streamType === "tournament"
          ? "Featured"
          : "Standard",
      match: liveMatch.streamType === "tournament" ? "Tournament Pool" : "Live Gameplay",
      stage:
        liveMatch.stageName ??
        (liveMatch.streamType === "tournament" ? "🔴 In Progress" : "🟢 Live Broadcast"),
      isLive: true,
    };
  }
  // 2. Dev / Offline Fallback to Mock Data (if not in live list)
  const allMocks = [MOCK_HEADLINE_STREAM, ...MOCK_STREAMS];
  const mockMatch = allMocks.find(
    (s) =>
      s.id.toLowerCase() === cleanId ||
      s.channelName.toLowerCase() === cleanId ||
      s.displayName.toLowerCase() === cleanId,
  );
  if (mockMatch) {
    return {
      id: mockMatch.id,
      channel: mockMatch.channelName,
      displayName: mockMatch.displayName,
      title: mockMatch.title,
      game: mockMatch.gameName,
      gameId: mockMatch.gameId,
      viewers: mockMatch.viewerCount.toLocaleString(),
      rawViewerCount: mockMatch.viewerCount,
      eventName: mockMatch.eventName ?? "FGC Live Broadcast",
      eventId: mockMatch.eventId ?? null,
      bracketUrl: "bracketUrl" in mockMatch ? ((mockMatch.bracketUrl as string) ?? null) : null,
      priority: mockMatch.id === MOCK_HEADLINE_STREAM.id ? "Headline" : "Standard",
      match: mockMatch.matchMetadata ?? "Live Gameplay",
      stage: mockMatch.type === "tournament" ? "🔴 In Progress" : "🟢 Live Broadcast",
      isLive: false,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main Watch View Component
// ---------------------------------------------------------------------------

export function WatchView() {
  const [theaterMode, setTheaterMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const { streamName } = Route.useParams();
  const navigate = useNavigate();
  // 1. Fetch live streams from KV cache
  const { data: streams, isLoading } = useLiveStreams();
  // 2. Pure memoized resolution
  const stream = useMemo(() => resolveStream(streamName, streams), [streamName, streams]);

  function handleShare() {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Avoid triggering when user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === "t") {
        setTheaterMode((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (theaterMode) {
      document.body.classList.add("theater-mode");
    } else {
      document.body.classList.remove("theater-mode");
    }
    return () => {
      document.body.classList.remove("theater-mode");
    };
  }, [theaterMode]);

  // 3. Loading state
  if (isLoading && !streams) {
    return (
      <div className="flex min-h-[calc(100vh-97px)] items-center justify-center bg-base">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm font-semibold text-copy-secondary">
            Connecting to live broadcast...
          </p>
        </div>
      </div>
    );
  }
  // 4. Stream Offline / Not Found state
  if (!stream) {
    return (
      <div className="flex min-h-[calc(100vh-97px)] flex-col items-center justify-center bg-base p-6 text-center">
        <h2 className="font-serif text-2xl font-bold text-copy-primary">Stream Offline</h2>
        <p className="mt-2 max-w-md text-sm text-copy-secondary">
          The channel <span className="font-mono text-accent">"{streamName}"</span> is not currently
          broadcasting or could not be found.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-6 rounded-full bg-accent px-5 py-2 text-xs font-bold text-black hover:bg-accent/90"
        >
          Return to Live Streams
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col overflow-hidden bg-base font-sans ${
        theaterMode ? "h-dvh" : "h-[calc(100dvh-var(--header-height,65px))]"
      }`}
    >
      {" "}
      {/* Top Breadcrumbs & Control Bar */}
      <WatchNav
        game={stream.game}
        eventName={stream.eventName}
        theaterMode={theaterMode}
        chatOpen={chatOpen}
        onToggleTheater={() => setTheaterMode((prev) => !prev)}
        onToggleChat={() => setChatOpen((prev) => !prev)}
        onBack={() => navigate({ to: "/" })}
      />
      {/* Main Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Video Player + Details */}
        <div
          className={`flex min-w-0 flex-1 flex-col overflow-y-auto ${
            theaterMode ? "snap-y snap-mandatory" : ""
          }`}
        >
          {/* Player Container */}
          <div className={theaterMode ? "h-full w-full shrink-0 snap-start" : ""}>
            <VideoPlayer stream={stream} theaterMode={theaterMode} />
          </div>
          {/* Under-Player Metadata & Actions */}
          <div className="flex shrink-0 flex-col gap-6 p-5 sm:p-6 lg:p-8">
            {/* Title & Action Buttons */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="font-serif text-xl font-bold tracking-tight text-copy-primary sm:text-2xl lg:text-3xl">
                  {stream.title}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-sm text-copy-secondary">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-b from-[#FFF282] to-[#c8b900] text-xs font-bold shadow-sm">
                    🎮
                  </div>
                  <span className="font-semibold text-copy-primary">{stream.displayName}</span>
                  <span className="text-line">·</span>
                  <span>{stream.game}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-elevated px-3.5 py-1.5 text-xs font-semibold text-copy-secondary transition-colors hover:border-accent/40 hover:text-copy-primary"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSaved((prev) => !prev)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    isSaved
                      ? "border-accent/40 bg-accent/15 text-accent"
                      : "border-line bg-elevated text-copy-secondary hover:border-accent/40 hover:text-copy-primary"
                  }`}
                >
                  {isSaved ? (
                    <>
                      <BookmarkCheck className="h-3.5 w-3.5 text-accent" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-3.5 w-3.5" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Match Metadata Card */}
            <MatchMetaCard stream={stream} />
          </div>
        </div>

        {/* Right Pane: Live Chat Sidebar */}
        {chatOpen && <ChatSidebar stream={stream} />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

interface WatchNavProps {
  game: string;
  eventName: string;
  theaterMode: boolean;
  chatOpen: boolean;
  onToggleTheater: () => void;
  onToggleChat: () => void;
  onBack: () => void;
}

function WatchNav({
  game,
  eventName,
  theaterMode,
  chatOpen,
  onToggleTheater,
  onToggleChat,
  onBack,
}: WatchNavProps) {
  return (
    <div className="flex h-12 items-center gap-3 border-b border-line bg-surface px-5 py-2.5">
      <button
        type="button"
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-copy-secondary transition-colors hover:text-copy-primary"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Streams
      </button>

      <div className="h-4 w-px bg-line" />

      <span className="text-xs text-copy-secondary">{game}</span>
      <ChevronRight className="h-3 w-3 text-line" />
      <span className="text-xs font-semibold text-copy-primary">{eventName}</span>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheater}
          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1 text-[11px] font-semibold tracking-wider text-copy-secondary uppercase transition-colors hover:border-accent/40 hover:text-copy-primary"
        >
          {theaterMode ? (
            <>
              <Minimize2 className="h-3 w-3" />
              Exit Theater
            </>
          ) : (
            <>
              <Maximize2 className="h-3 w-3" />
              Theater Mode
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onToggleChat}
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
            chatOpen
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-line bg-elevated text-copy-secondary hover:border-accent/40 hover:text-copy-primary"
          }`}
        >
          <MessageSquare className="h-3 w-3" />
          Chat
        </button>
      </div>
    </div>
  );
}

interface VideoPlayerProps {
  stream: ResolvedStream;
  theaterMode: boolean;
}

function VideoPlayer({ stream, theaterMode }: VideoPlayerProps) {
  const hostname = useHostName();

  return (
    <div
      className={`relative w-full shrink-0 bg-black transition-all duration-200 ${
        theaterMode ? "aspect-auto h-full min-h-[60vh] lg:min-h-full" : "aspect-video max-h-[75vh]"
      }`}
    >
      <iframe
        src={`https://player.twitch.tv/?channel=${stream.channel}&parent=${hostname}&autoplay=true&muted=false`}
        className="absolute inset-0 h-full w-full border-0"
        allowFullScreen
      />
    </div>
  );
}

function MatchMetaCard({ stream }: { stream: ResolvedStream }) {
  const metadata = [
    { label: "Event", value: stream.eventName, accent: false },
    { label: "Match", value: stream.match, accent: false },
    { label: "Status", value: stream.stage, accent: true },
    { label: "Priority", value: stream.priority, accent: stream.priority === "Headline" },
  ];

  return (
    <div className="flex flex-wrap gap-6 rounded-xl border border-line bg-surface p-5 sm:gap-8">
      {metadata.map(({ label, value, accent }) => (
        <div key={label} className="flex flex-col">
          <span className="mb-1 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
            {label}
          </span>
          <span className={`text-sm font-semibold ${accent ? "text-accent" : "text-copy-primary"}`}>
            {value}
          </span>
        </div>
      ))}

      {stream.bracketUrl && (
        <div className="flex flex-col">
          <span className="mb-1 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
            Bracket
          </span>
          <a
            href={stream.bracketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-accent transition-opacity hover:underline hover:opacity-90"
          >
            View on Start.gg
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function ChatSidebar({ stream }: { stream: ResolvedStream }) {
  const hostname = useHostName();

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col overflow-hidden border-l border-line bg-surface sm:w-80 lg:w-88">
      <iframe
        src={`https://www.twitch.tv/embed/${stream.channel}/chat?parent=${hostname}&darkpopout`}
        className="h-full w-full border-0"
      />
    </aside>
  );
}
