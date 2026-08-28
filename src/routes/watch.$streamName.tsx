import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Play,
  Maximize2,
  Minimize2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellRing,
  ExternalLink,
  Trophy,
  Users,
  Share2,
  Bookmark,
  BookmarkCheck,
  Check,
} from "lucide-react";
import {
  MOCK_HEADLINE_STREAM,
  MOCK_STREAMS,
  MOCK_EVENTS,
  type MockStream,
  type HeadlineFeaturedStream,
} from "#/mocks/data";

export const Route = createFileRoute("/watch/$streamName")({
  component: WatchView,
});

// ---------------------------------------------------------------------------
// Mock Chat Data
// ---------------------------------------------------------------------------

interface ChatMessage {
  user: string;
  msg: string;
  time: string;
}

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { user: "SonicBoom99", msg: "LET'S GOOO TOKIDO", time: "10:42" },
  { user: "FGCaddict", msg: "the comeback is real", time: "10:42" },
  { user: "GuiltyGearHead", msg: "SF6 drive mechanics are insane this set", time: "10:43" },
  { user: "TekkenGod", msg: "nuckledu looking shaky on the zoning", time: "10:43" },
  { user: "EVO_Fan2026", msg: "biggest EVO crowd since 2019 🔥", time: "10:44" },
  { user: "ComboBreaker", msg: "bracket predictions BLOWN", time: "10:44" },
  { user: "StreetFighterFan", msg: "GRAND FINALS RESET!!!", time: "10:44" },
  { user: "FightingGameMom", msg: "this is incredible", time: "10:45" },
  { user: "CPT_Observer", msg: "tokido looks locked in", time: "10:45" },
  { user: "DriveImpact", msg: "DP DP DP DP", time: "10:45" },
  { user: "Kusoru", msg: "SF6 is so hype rn", time: "10:46" },
  { user: "Hayabusa", msg: "that footsie game is CLEAN", time: "10:46" },
  { user: "MomochiLvr", msg: "old heads stay winning 👏", time: "10:46" },
  { user: "FGC_Lurker", msg: "Pog Pog Pog Pog", time: "10:47" },
  { user: "BronzeNation", msg: "I can't believe I'm watching this live", time: "10:47" },
];

// ---------------------------------------------------------------------------
// Stream Resolution Helper
// ---------------------------------------------------------------------------

interface ResolvedStream {
  id: string;
  title: string;
  channel: string;
  game: string;
  viewers: string;
  eventName: string;
  eventId: string | null;
  bracketUrl: string;
  priority: string;
  match: string;
  stage: string;
}

function resolveStream(streamName?: string): ResolvedStream {
  const allStreams: (MockStream | HeadlineFeaturedStream)[] = [
    MOCK_HEADLINE_STREAM,
    ...MOCK_STREAMS,
  ];

  const matched = streamName
    ? allStreams.find(
        (s) =>
          s.id.toLowerCase() === streamName.toLowerCase() ||
          s.channelName.toLowerCase() === streamName.toLowerCase() ||
          s.displayName.toLowerCase() === streamName.toLowerCase(),
      )
    : null;

  const stream = matched ?? MOCK_HEADLINE_STREAM;
  const matchingEvent = stream.eventId
    ? MOCK_EVENTS.find((e) => e.id === stream.eventId)
    : null;

  const bracketUrl =
    ("bracketUrl" in stream && stream.bracketUrl ? stream.bracketUrl : null) ??
    matchingEvent?.registrationUrl ??
    "https://start.gg";

  const priority =
    matchingEvent?.featuredPriority === "headline" || stream.id === MOCK_HEADLINE_STREAM.id
      ? "Headline"
      : stream.type === "tournament"
        ? "Featured"
        : "Standard";

  const match =
    stream.matchMetadata ??
    (stream.type === "tournament" ? "Tournament Pool" : "Live Gameplay");

  const stage = stream.type === "tournament" ? "🔴 In Progress" : "🟢 Live Broadcast";

  return {
    id: stream.id,
    title: stream.title,
    channel: stream.displayName,
    game: stream.gameName,
    viewers: stream.viewerCount.toLocaleString(),
    eventName: stream.eventName ?? matchingEvent?.name ?? "FGC Live Broadcast",
    eventId: stream.eventId,
    bracketUrl,
    priority,
    match,
    stage,
  };
}

// ---------------------------------------------------------------------------
// Main Watch View Component
// ---------------------------------------------------------------------------

export function WatchView() {
  const { streamName } = Route.useParams();
  const navigate = useNavigate();
  const stream = resolveStream(streamName);

  const [theaterMode, setTheaterMode] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  function handleShare() {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-97px)] flex-col bg-base font-sans">
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
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Player Container */}
          <VideoPlayer stream={stream} theaterMode={theaterMode} />

          {/* Under-Player Metadata & Actions */}
          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:p-8">
            {/* Title & Action Buttons */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="font-serif text-xl font-bold tracking-tight text-copy-primary sm:text-2xl lg:text-3xl">
                  {stream.title}
                </h1>
                <div className="mt-2 flex items-center gap-2 text-sm text-copy-secondary">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF282] to-[#c8b900] text-xs font-bold shadow-sm">
                    🎮
                  </div>
                  <span className="font-semibold text-copy-primary">{stream.channel}</span>
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

            {/* Push Notifications Card */}
            <PushNotificationCard
              game={stream.game}
              enabled={pushEnabled}
              onToggle={() => setPushEnabled((prev) => !prev)}
            />
          </div>
        </div>

        {/* Right Pane: Live Chat Sidebar */}
        {chatOpen && <ChatSidebar />}
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
    <div className="flex items-center gap-3 border-b border-line bg-surface px-5 py-2.5">
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
  return (
    <div
      className={`relative flex w-full items-center justify-center overflow-hidden bg-black transition-all duration-300 ${
        theaterMode ? "aspect-[21/9]" : "aspect-video"
      }`}
    >
      {/* Visual Ambient Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_40%_55%,rgba(0,112,243,0.18)_0%,transparent_65%),radial-gradient(ellipse_at_75%_30%,rgba(255,242,130,0.06)_0%,transparent_50%)]" />

      {/* Centered Play Trigger Button */}
      <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent/30 bg-accent/10 backdrop-blur-xs transition-transform duration-200 hover:scale-110">
        <Play className="h-8 w-8 translate-x-0.5 fill-current text-accent/80" />
      </div>

      {/* Top Player Badges */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
        {/* LIVE Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-black">
          <span className="h-1.5 w-1.5 rounded-full bg-black" />
          LIVE
        </div>

        {/* Viewer Count */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
          <Users className="h-3 w-3 text-copy-secondary" />
          <span>{stream.viewers}</span>
          <span className="text-[11px] font-normal text-copy-secondary">watching</span>
        </div>
      </div>

      {/* Bottom Meta Overlay */}
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pt-8 pb-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-accent uppercase">
          <Trophy className="h-3 w-3 text-accent" />
          <span>
            {stream.eventName} · {stream.match}
          </span>
        </div>
        <div className="font-serif text-lg font-bold tracking-tight text-white sm:text-xl">
          {stream.title}
        </div>
      </div>
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
          <span
            className={`text-sm font-semibold ${
              accent ? "text-accent" : "text-copy-primary"
            }`}
          >
            {value}
          </span>
        </div>
      ))}

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
    </div>
  );
}

interface PushNotificationCardProps {
  game: string;
  enabled: boolean;
  onToggle: () => void;
}

function PushNotificationCard({ game, enabled, onToggle }: PushNotificationCardProps) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-200 sm:p-6 ${
        enabled
          ? "border border-success/30 bg-success/5"
          : "border border-line bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {enabled ? (
              <BellRing className="h-4 w-4 text-success" />
            ) : (
              <Bell className="h-4 w-4 text-copy-secondary" />
            )}
            <span className="text-sm font-bold text-copy-primary sm:text-base">
              Web Push Notifications
            </span>
            {enabled && (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-success">
                ● ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-copy-secondary sm:text-sm">
            {enabled
              ? `You'll be notified when ${game} tournament streams go live or enter bracket stages.`
              : `Get notified when ${game} streams go live, bracket stages start, or top 8 begins.`}
          </p>
        </div>

        {/* Accessible Switch Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            enabled ? "border-success/40 bg-success" : "border-line bg-elevated"
          }`}
        >
          <span
            className={`inline-block h-4.5 w-4.5 rounded-full transition-transform duration-200 ${
              enabled
                ? "translate-x-5 translate-y-[2px] bg-black"
                : "translate-x-1 translate-y-[2px] bg-copy-secondary"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function ChatSidebar() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [chatInput, setChatInput] = useState("");

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    setMessages((prev) => [...prev, { user: "You", msg: chatInput.trim(), time }]);
    setChatInput("");
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-line bg-surface sm:w-80">
      {/* Chat Header */}
      <div className="flex items-center gap-2 border-b border-line p-3.5">
        <MessageSquare className="h-3.5 w-3.5 text-accent" />
        <span className="text-xs font-bold text-copy-primary sm:text-sm">Live Chat</span>
        <span className="ml-auto text-[11px] text-copy-secondary">via Twitch</span>
      </div>

      {/* Message Feed */}
      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3.5">
        {messages.map((msg, i) => {
          const hue = (msg.user.charCodeAt(0) * 37) % 360;
          return (
            <div key={`${msg.user}-${i}`} className="flex items-start gap-2">
              <div
                style={{ backgroundColor: `hsl(${hue}, 50%, 30%)` }}
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
              >
                {msg.user[0]}
              </div>
              <div className="min-w-0 flex-1 leading-relaxed">
                <span className="mr-1.5 text-[11px] font-bold text-accent">
                  {msg.user}
                </span>
                <span className="text-xs text-copy-primary">{msg.msg}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="border-t border-line p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Send a message..."
            className="flex-1 rounded-full border border-line bg-elevated px-3.5 py-1.5 text-xs text-copy-primary placeholder:text-copy-secondary/50 outline-none transition-colors focus:border-accent/40"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-full bg-accent px-3.5 py-1.5 text-xs font-extrabold text-black transition-colors hover:bg-accent/90"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
