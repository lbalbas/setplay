import { useState } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useLiveStreams } from "#/hooks/useLiveStreams";
import {
  Shield,
  Star,
  Link2,
  Clock,
  RefreshCw,
  Terminal,
  Database,
  CheckCircle,
  AlertCircle,
  Info,
  Lock,
  LogOut,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getEvents } from "#/server/events";
import type { MatchedStream, StreamPriority } from "#/server/matching";
import type { CronLogEntry } from "#/server/cron";
import { triggerStreamSync } from "#/server/cron";
import getLogs from "#/server/logs";
import { loginAdmin, logoutAdmin } from "#/server/auth";
import { useQuery } from "@tanstack/react-query";
import {
  getStreamOverrides,
  saveStreamOverride,
  removeStreamOverride,
  type OverrideDurationOption,
} from "#/server/overrides";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/admin")({
  loader: async ({ context }) => {
    if (!context.auth.isAuthenticated) {
      return { events: [], logs: [], overrides: {}, isAuthenticated: false };
    }
    const [events, logs, overrides] = await Promise.all([
      getEvents(),
      getLogs(),
      getStreamOverrides(),
    ]);
    return { events, logs, isAuthenticated: true, overrides };
  },
  component: AdminPage,
});

function AdminPage() {
  const { isAuthenticated } = Route.useLoaderData();

  if (!isAuthenticated) {
    return <AdminGate />;
  }

  return <AdminDashboard />;
}

function AdminGate() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await loginAdmin({ data: { token: token.trim() } });
      if (res.success) {
        // Invalidate router context so __root beforeLoad and /admin loader re-evaluate
        await router.invalidate();
      } else {
        setError(res.error || "Invalid administrator credentials");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to authenticate");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-serif text-xl font-bold tracking-tight text-copy-primary">
            Admin Access Required
          </h1>
          <p className="mt-1 text-xs text-copy-secondary">
            Enter your secret administrative token to access system overrides and logs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="token" className="text-xs font-semibold text-copy-secondary">
              Secret Token
            </label>
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-copy-secondary/50" />
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="••••••••••••••••"
                required
                autoFocus
                className="w-full rounded-xl border border-line bg-elevated py-2.5 pr-4 pl-9 text-xs text-copy-primary placeholder-copy-secondary/40 transition-colors outline-none focus:border-accent"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-bold text-black transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Authorize Session"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatViewers(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

type TabId = "streams" | "cron";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("streams");
  const { events, logs: initialLogs, overrides = {} } = Route.useLoaderData();
  const streams = useLiveStreams().data ?? [];
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await logoutAdmin();
    await router.invalidate();
  };

  const { data: logs = initialLogs } = useQuery({
    queryKey: ["admin-cron-logs"],
    queryFn: () => getLogs(),
    initialData: initialLogs,
    refetchInterval: activeTab === "cron" ? 15_000 : false,
  });

  const [editingStreamId, setEditingStreamId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMutatingOverride, setIsMutatingOverride] = useState(false);

  // Sidebar form state
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<StreamPriority>("normal");
  const [selectedDurationOption, setSelectedDurationOption] = useState<
    "event_end" | "stream_session" | "4h" | "12h" | "24h"
  >("event_end");

  // Derived stats
  const activeCount = streams.length;
  const linkedCount = streams.filter((s) => s.matchedEvent?.eventId != null).length;
  const headlineCount = streams.filter((s) => s.priority === "headline").length;
  const editingStream = streams.find((s) => s.id === editingStreamId) ?? null;

  const latestLogTime = logs?.length
    ? Math.max(...logs.map((l) => new Date(l.timestamp).getTime()))
    : null;
  const lastSyncText = latestLogTime
    ? formatDistanceToNow(new Date(latestLogTime), { addSuffix: true })
    : "Never";

  const handleSyncStreams = async () => {
    setIsSyncing(true);
    try {
      await triggerStreamSync();
      await queryClient.invalidateQueries({ queryKey: ["live-streams"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-cron-logs"] });
      await router.invalidate();
    } catch (err: unknown) {
      alert("Failed to sync streams: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSyncing(false);
    }
  };

  function handleEdit(stream: MatchedStream) {
    const override = overrides[stream.id];
    setEditingStreamId(stream.id);
    const evId = override?.eventId ?? stream.matchedEvent?.eventId ?? "";
    setSelectedEventId(evId);
    setSelectedPriority(override?.priority ?? stream.priority ?? "normal");
    setSelectedDurationOption(evId ? "event_end" : "4h");
  }

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    if (!eventId && selectedDurationOption === "event_end") {
      setSelectedDurationOption("4h");
    }
  };

  async function handleRemoveOverride(streamId?: string) {
    const targetId = streamId ?? editingStreamId;
    if (!targetId) return;

    setIsMutatingOverride(true);
    try {
      await removeStreamOverride({
        data: { streamId: targetId },
      });
      await queryClient.invalidateQueries({ queryKey: ["live-streams"] });
      await router.invalidate();
      if (editingStreamId === targetId) {
        setEditingStreamId(null);
        setSelectedEventId("");
        setSelectedPriority("normal");
      }
    } catch (err: unknown) {
      alert("Failed to remove override: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsMutatingOverride(false);
    }
  }

  async function handleApplyOverride() {
    if (!editingStreamId) return;
    const stream = streams.find((s) => s.id === editingStreamId);
    if (!stream) return;

    if (selectedEventId === "" && selectedDurationOption === "event_end") {
      alert(
        "Cannot set duration to 'Until Event Ends' when no event is selected. Please choose a different duration or select an event.",
      );
      return;
    }

    setIsMutatingOverride(true);
    try {
      await saveStreamOverride({
        data: {
          streamId: editingStreamId,
          streamName: stream.displayName,
          durationOption: selectedDurationOption,
          eventId: selectedEventId || null,
          streamStartedAt: stream.startedAt,
          priority: selectedPriority,
        },
      });

      await queryClient.invalidateQueries({ queryKey: ["live-streams"] });
      await router.invalidate();

      setEditingStreamId(null);
      setSelectedEventId("");
      setSelectedPriority("normal");
    } catch (err: unknown) {
      alert("Failed to apply override: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsMutatingOverride(false);
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="border-t border-accent-glow bg-surface py-8">
        <div className="mx-auto flex w-11/12 max-w-screen-2xl flex-col gap-4">
          {/* Title row */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-xs font-bold tracking-wide text-accent uppercase">
                  <Shield aria-hidden="true" className="h-4 w-4" />
                  Admin Portal
                </span>
                <span className="inline-flex items-center rounded-xl border border-green-400 bg-emerald-300/10 px-3 py-0.5 text-xs font-bold tracking-wide text-green-400 uppercase">
                  · Authorized
                </span>
              </div>
              <h1 className="font-serif text-2xl font-bold text-copy-primary">
                Stream Management Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSyncStreams}
                disabled={isSyncing}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-copy-primary transition-colors hover:border-accent hover:bg-elevated disabled:opacity-50"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
                />
                {isSyncing ? "Syncing..." : "Sync Streams"}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-red-400 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
                title="End administrator session"
              >
                <LogOut aria-hidden="true" className="h-4 w-4" />
                <span>Lock</span>
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4">
            <StatCard
              icon={<Database aria-hidden="true" className="h-4 w-4 text-copy-secondary" />}
              value={activeCount.toString()}
              label="Active Streams"
            />
            <StatCard
              icon={<Link2 aria-hidden="true" className="h-4 w-4 text-copy-secondary" />}
              value={linkedCount.toString()}
              label="Linked to Events"
            />
            <StatCard
              icon={<Star aria-hidden="true" className="h-4 w-4 text-copy-secondary" />}
              value={headlineCount.toString()}
              label="Headline Priority"
            />
            <StatCard
              icon={<Clock aria-hidden="true" className="h-4 w-4 text-copy-secondary" />}
              value={lastSyncText}
              label="Last Sync"
            />
          </div>
        </div>
      </div>

      {/* Tabs + Content */}
      <div className="mx-auto w-11/12 max-w-screen-2xl py-6">
        {/* Tab bar */}
        <div className="flex gap-6 border-b border-line">
          <TabButton
            active={activeTab === "streams"}
            onClick={() => setActiveTab("streams")}
            icon={<Database aria-hidden="true" className="h-4 w-4" />}
            label="Active Streams"
          />
          <TabButton
            active={activeTab === "cron"}
            onClick={() => setActiveTab("cron")}
            icon={<Terminal aria-hidden="true" className="h-4 w-4" />}
            label="Cron Logs"
          />
        </div>

        {/* Tab content */}
        <div className="pt-6">
          {activeTab === "streams" && (
            <div className="flex gap-6">
              {/* Stream table */}
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden rounded-xl border border-line">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface">
                        <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Channel / Game
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Viewers
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Event Link
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Priority
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Status
                        </th>
                        <th className="px-5 py-3 text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {streams.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-8 text-center text-xs text-copy-secondary"
                          >
                            No active live streams currently cached. Click "Sync Streams" to ingest
                            from Twitch & start.gg.
                          </td>
                        </tr>
                      ) : (
                        streams.map((stream) => {
                          const override = overrides[stream.id] || overrides[stream.streamName];
                          const priority = stream.priority ?? override?.priority ?? "normal";
                          const eventId = stream.matchedEvent?.eventId ?? override?.eventId;
                          const isLinked = Boolean(eventId);
                          const hasActiveOverride = Boolean(overrides[stream.id]);

                          return (
                            <tr
                              key={stream.id}
                              className={`border-b border-line/50 transition-colors last:border-b-0 ${
                                editingStreamId === stream.id
                                  ? "bg-elevated/60"
                                  : "hover:bg-elevated/30"
                              }`}
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2 font-semibold text-copy-primary">
                                  <span>{stream.displayName}</span>
                                  {hasActiveOverride && (
                                    <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent uppercase">
                                      Override
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-copy-secondary">{stream.gameName}</div>
                              </td>
                              <td className="px-5 py-4 font-bold text-copy-primary">
                                {formatViewers(stream.viewerCount)}
                              </td>
                              <td className="px-5 py-4">
                                {isLinked ? (
                                  <span className="cursor-pointer text-sm font-medium text-green-400 hover:underline">
                                    {stream.matchedEvent?.eventName ??
                                      override?.eventName ??
                                      stream.matchedEvent?.eventId}
                                  </span>
                                ) : (
                                  <span className="text-sm text-copy-secondary/50">Unlinked</span>
                                )}
                              </td>
                              <td className="px-5 py-4">
                                <PriorityBadge priority={priority} />
                              </td>
                              <td className="px-5 py-4">
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400">
                                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                                  LIVE
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(stream)}
                                    className="cursor-pointer rounded border border-line bg-surface px-3 py-1 text-xs font-semibold tracking-wide text-copy-secondary uppercase transition-colors hover:border-accent hover:text-accent"
                                  >
                                    Edit
                                  </button>
                                  {hasActiveOverride && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOverride(stream.id)}
                                      disabled={isMutatingOverride}
                                      className="cursor-pointer rounded border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold tracking-wide text-red-400 uppercase transition-colors hover:bg-red-500/20 disabled:opacity-50"
                                      title="Reset stream override to automatic matching"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Link Stream to Event sidebar */}
              <div className="w-72 shrink-0">
                <div className="rounded-xl border border-line bg-surface p-5">
                  <h3 className="flex items-center gap-2 font-serif font-bold text-copy-primary">
                    <Link2 aria-hidden="true" className="h-4 w-4" />
                    Link Stream to Event
                  </h3>

                  {editingStream ? (
                    <div className="mt-4 flex flex-col gap-4">
                      <p className="text-sm text-copy-secondary">
                        Editing:{" "}
                        <span className="font-bold text-copy-primary">
                          {editingStream.displayName}
                        </span>
                      </p>

                      {/* Event ID */}
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="event-select"
                          className="text-[11px] font-bold tracking-wider text-copy-secondary uppercase"
                        >
                          Event ID
                        </label>
                        <select
                          id="event-select"
                          value={selectedEventId}
                          onChange={(e) => handleEventChange(e.target.value)}
                          className="cursor-pointer rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-copy-primary transition-colors outline-none focus:border-accent"
                        >
                          <option value="">No Event (Casual / Unlinked)</option>
                          <optgroup label="Active & Upcoming Events">
                            {events.map((ev) => (
                              <option key={ev.id} value={ev.id}>
                                {ev.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      {/* Priority Level */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Priority Level
                        </label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value as StreamPriority)}
                          className="cursor-pointer rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-copy-primary transition-colors outline-none focus:border-accent"
                        >
                          <option value="normal">Normal</option>
                          <option value="featured">Featured</option>
                          <option value="headline">Headline</option>
                        </select>
                      </div>

                      {/* Duration Option */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold tracking-wider text-copy-secondary uppercase">
                          Override Duration
                        </label>
                        <select
                          value={selectedDurationOption}
                          onChange={(e) =>
                            setSelectedDurationOption(e.target.value as OverrideDurationOption)
                          }
                          className="cursor-pointer rounded-lg border border-line bg-elevated px-3 py-2 text-sm text-copy-primary transition-colors outline-none focus:border-accent"
                        >
                          {selectedEventId && <option value="event_end">Until Event Ends</option>}
                          <option value="stream_session">Until Stream Ends (Session Anchor)</option>
                          <option value="4h">4 Hours</option>
                          <option value="12h">12 Hours</option>
                          <option value="24h">24 Hours</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-2 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={handleApplyOverride}
                          disabled={isMutatingOverride}
                          className="flex cursor-pointer items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-xs font-bold tracking-wide text-black uppercase transition-colors hover:bg-accent/90 disabled:opacity-50"
                        >
                          {isMutatingOverride ? "Saving..." : "Apply Override"}
                        </button>

                        {overrides[editingStream.id] && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOverride(editingStream.id)}
                            disabled={isMutatingOverride}
                            className="cursor-pointer rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 uppercase transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            Remove Override
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setEditingStreamId(null)}
                          className="cursor-pointer rounded-lg border border-line bg-elevated/40 px-4 py-1.5 text-xs font-semibold text-copy-secondary transition-colors hover:text-copy-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-relaxed text-copy-secondary">
                      Select a stream from the table to link it to a tournament event.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "cron" && (
            <div className="overflow-hidden rounded-xl border border-line">
              {/* Log header */}
              <div className="flex items-center justify-between bg-surface px-5 py-4">
                <h3 className="flex items-center gap-2 font-serif font-bold text-copy-primary">
                  <Terminal aria-hidden="true" className="h-4 w-4" />
                  Cron Job Status Log
                </h3>
              </div>

              {/* Log entries */}
              <div className="divide-y divide-line/40">
                {logs
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-center gap-4 px-5 py-3 ${
                        log.status === "warning"
                          ? "bg-yellow-500/5"
                          : log.status === "error"
                            ? "bg-red-500/5"
                            : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <span className="w-40 shrink-0 font-mono text-xs text-copy-secondary">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>

                      {/* Status icon */}
                      <CronStatusIcon status={log.status} />

                      {/* Tag */}
                      <span
                        className={`shrink-0 rounded px-2 py-0.5 font-mono text-xs font-bold ${cronTagStyle(log.tag)}`}
                      >
                        [{log.tag}]
                      </span>

                      {/* Message */}
                      <span
                        className={`text-sm ${
                          log.status === "warning"
                            ? "text-yellow-400"
                            : log.status === "error"
                              ? "text-red-400"
                              : "text-copy-secondary"
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
      {icon}
      <div className="flex flex-col">
        <span className="font-serif text-lg font-bold text-copy-primary">{value}</span>
        <span className="text-[11px] text-copy-secondary">{label}</span>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition-colors ${
        active
          ? "border-accent text-copy-primary"
          : "border-transparent text-copy-secondary hover:text-copy-primary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PriorityBadge({ priority }: { priority: StreamPriority }) {
  const styles: Record<StreamPriority, string> = {
    headline: "text-accent",
    featured: "text-green-400",
    normal: "text-copy-secondary",
  };

  return (
    <span className={`text-sm font-medium capitalize ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function CronStatusIcon({ status }: { status: CronLogEntry["status"] }) {
  switch (status) {
    case "info":
      return <Info aria-hidden="true" className="h-4 w-4 shrink-0 text-blue-400" />;
    case "success":
      return <CheckCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-green-400" />;
    case "warning":
      return <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-yellow-400" />;
    case "error":
      return <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-red-400" />;
  }
}

function cronTagStyle(tag: CronLogEntry["tag"]): string {
  switch (tag) {
    case "stream-sync":
      return "bg-green-400/10 text-green-400";
    case "bracket-poll":
      return "bg-purple-400/10 text-purple-400";
    case "push-notify":
      return "bg-yellow-400/10 text-yellow-400";
    case "calendar-sync":
      return "bg-blue-400/10 text-blue-400";
  }
}
