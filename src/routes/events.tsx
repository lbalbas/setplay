import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Funnel,
  MapPin,
  Wifi,
  Calendar,
  UsersRound,
  Trophy,
  SquareArrowOutUpRight,
  Bell,
  BellRing,
  Loader2,
} from "lucide-react";
import { useGameFilter } from "#/context/GameFilterContext";
import { getEvents } from "#/server/events";
import { useEventPushSubscription } from "#/hooks/useEventPushSubscription";

export const Route = createFileRoute("/events")({
  component: EventPage,
  loader: () => getEvents(),
});

function EventPage() {
  const [presentialEventFilter, setPresentialEventFilter] = useState<boolean | "all">("all");
  const [statusEventFilter, setStatusEventFilter] = useState("all");
  const { selectedGame: contextSelectedGame } = useGameFilter();
  const selectedGame = contextSelectedGame;
  const events = Route.useLoaderData();
  const { isSubscribed, isLoading, toggleSubscription } = useEventPushSubscription();

  const liveEvents = events.filter((event) => event.status === "live").length;
  const upcomingEvents = events.filter((event) => event.status === "upcoming").length;

  const filteredEvents = events.filter((event) => {
    const matchesGame =
      selectedGame === "all" || event.games.some((game) => game.id === selectedGame);
    const matchesStatus = statusEventFilter === "all" || event.status === statusEventFilter;
    const matchesLocation =
      presentialEventFilter === "all" || event.isOnline === presentialEventFilter;
    return matchesGame && matchesStatus && matchesLocation;
  });

  return (
    <main>
      <div className="border-t border-accent-glow bg-surface py-8">
        <div className="mx-auto flex w-11/12 max-w-screen-2xl items-center justify-between">
          <div className="flex flex-col ">
            <span className="flex items-center text-xs font-bold tracking-wide text-accent uppercase">
              <Trophy aria-hidden="true" className="h-4" />
              EVENTS DIRECTORY
            </span>
            <h1 className="font-serif text-3xl font-bold text-copy-primary">
              FGC Tournament Calendar
            </h1>
            <span className="text-copy-secondary">
              {liveEvents} events live · {upcomingEvents} upcoming events
            </span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className="flex flex-col items-end">
              <div className="font-serif text-2xl font-bold text-copy-primary">{events.length}</div>
              <span className="text-xs text-copy-secondary">Total Events</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="font-serif text-2xl font-bold text-copy-primary">{"$600K+"}</div>
              <span className="text-xs text-copy-secondary">Prize Pool Total</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="font-serif text-2xl font-bold text-copy-primary">{"14,000+"}</div>
              <span className="text-xs text-copy-secondary">Active Players</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-8xl mx-auto w-11/12 py-8">
        <div className="flex w-full gap-8 rounded-lg border border-accent-glow bg-surface px-6 py-4 text-copy-secondary">
          <span className="flex items-center text-sm text-copy-secondary uppercase">
            <Funnel aria-hidden="true" className="h-4" />
            <span className="ml-1">Filters</span>
          </span>
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Event location filters"
              className="flex items-center gap-2 border-r border-accent-glow pr-6 text-sm"
            >
              <button
                type="button"
                className={`cursor-pointer rounded-xl px-3 py-1 transition-colors ${presentialEventFilter === "all" ? "bg-accent font-bold text-base" : "bg-elevated hover:text-copy-primary"}`}
                onClick={() => setPresentialEventFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`flex cursor-pointer items-center rounded-xl px-3 py-1 transition-colors ${presentialEventFilter === true ? "bg-accent font-bold text-base" : "bg-elevated hover:text-copy-primary"}`}
                onClick={() => setPresentialEventFilter(true)}
              >
                <Wifi aria-hidden="true" className="h-3" />
                <span className="ml-1">Online</span>
              </button>
              <button
                type="button"
                className={`flex cursor-pointer items-center rounded-xl px-3 py-1 transition-colors ${presentialEventFilter === false ? "bg-accent font-bold text-base" : "bg-elevated hover:text-copy-primary"}`}
                onClick={() => setPresentialEventFilter(false)}
              >
                <MapPin aria-hidden="true" className="h-3" />
                <span className="ml-1">Offline</span>
              </button>
            </div>
            <div role="group" aria-label="Event status filters" className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  className={`cursor-pointer rounded-xl px-3 py-1 transition-colors ${statusEventFilter === "all" ? "bg-elevated font-bold text-copy-primary" : ""}`}
                  onClick={() => setStatusEventFilter("all")}
                >
                  All Status
                </button>
                <button
                  type="button"
                  className={`cursor-pointer rounded-xl px-3 py-1 transition-colors ${statusEventFilter === "live" ? "bg-elevated font-bold text-copy-primary" : ""}`}
                  onClick={() => setStatusEventFilter("live")}
                >
                  Ongoing
                </button>
                <button
                  type="button"
                  className={`cursor-pointer rounded-xl px-3 py-1 transition-colors ${statusEventFilter === "upcoming" ? "bg-elevated font-bold text-copy-primary" : ""}`}
                  onClick={() => setStatusEventFilter("upcoming")}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-3 py-1 transition-colors ${statusEventFilter === "completed" ? "bg-elevated font-bold text-copy-primary" : ""}`}
                  onClick={() => setStatusEventFilter("completed")}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-11/12 flex-col gap-4 py-8">
          {filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-accent-glow bg-surface px-6 py-16 text-center">
              <Calendar aria-hidden="true" className="mb-3 h-10 w-10 text-copy-secondary/40" />
              <h3 className="font-serif text-xl font-bold text-copy-primary">No events found</h3>
              <p className="mt-1 max-w-sm text-sm text-copy-secondary">
                No events match your current filter settings. Try selecting a different game,
                status, or format.
              </p>

              <button
                type="button"
                onClick={() => {
                  setPresentialEventFilter("all");
                  setStatusEventFilter("all");
                }}
                className="mt-4 cursor-pointer rounded-xl bg-elevated px-4 py-2 text-xs font-bold text-copy-primary transition-colors hover:bg-accent hover:text-black"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredEvents.map((event) => {
              let shouldRender =
                (selectedGame === "all" ||
                  event.games.map((game) => game.id).includes(selectedGame)) &&
                (statusEventFilter === "all" || event.status === statusEventFilter) &&
                (presentialEventFilter === "all" || event.isOnline === presentialEventFilter);

              return !shouldRender ? null : (
                <div
                  key={event.id}
                  className="relative flex w-full justify-between overflow-hidden rounded-lg border border-accent-glow bg-surface p-8"
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1 ${
                      event.status === "live" ? "bg-accent" : "bg-copy-secondary"
                    }`}
                  />
                  <div className="flex w-1/2 flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {event.status === "live" ? (
                        <span className="inline-flex items-center gap-1 rounded border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-accent uppercase shadow-[0_0_8px_rgba(255,242,130,0.15),0_0_20px_rgba(255,242,130,0.08)]">
                          <span className="h-1 w-1 animate-pulse rounded-full bg-accent shadow-[0_0_4px_#FFF282]" />
                          Live Now
                        </span>
                      ) : event.status === "upcoming" ? (
                        <span className="inline-flex items-center gap-1 rounded border border-line bg-elevated px-2 py-0.5 text-[10px] font-bold tracking-wider text-copy-secondary uppercase">
                          Upcoming
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded border border-line/40 bg-[#161613] px-2 py-0.5 text-[10px] font-medium tracking-wider text-copy-secondary/50 uppercase">
                          Completed
                        </span>
                      )}
                      {event.isOnline ? (
                        <span className="flex items-center text-xs text-copy-secondary">
                          <Wifi aria-hidden="true" className="h-3" /> Online
                        </span>
                      ) : (
                        <span className="flex items-center text-xs  text-copy-secondary">
                          <MapPin aria-hidden="true" className="h-3" /> Offline
                        </span>
                      )}
                    </div>
                    <div className="font-serif text-2xl text-copy-primary">{event.name}</div>
                    <p className="text-sm text-copy-secondary">{event.description ?? ""}</p>
                    <div className="flex flex-wrap gap-1">
                      {event.games.map((game) => {
                        return (
                          <span
                            key={game.name}
                            className="mt-1 rounded-xl bg-elevated px-2 py-1 text-xs text-copy-secondary"
                          >
                            {game.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex w-1/2 flex-col items-end gap-2">
                    <span className="flex items-center text-sm font-bold text-copy-primary">
                      <Calendar aria-hidden="true" className="h-3" />
                      {new Intl.DateTimeFormat("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      }).formatRange(event.startDate, event.endDate)}
                    </span>
                    <span className="flex items-center text-xs text-copy-secondary">
                      <MapPin aria-hidden="true" className="h-3" />{" "}
                      {event.isOnline ? "Online" : (event.location ?? "")}
                    </span>
                    <span className="flex items-center text-xs text-copy-secondary">
                      <UsersRound aria-hidden="true" className="h-3" />
                      {event.attendeeCount ? event.attendeeCount.toLocaleString() : ""}
                    </span>
                    <div className="flex flex-col items-end pt-2">
                      <span className="font-serif text-lg font-bold text-copy-primary">
                        {event.prizePool ? `$${event.prizePool.toLocaleString()}` : ""}
                      </span>
                      <span className="text-xs text-copy-secondary">prize pool</span>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSubscription(event.id)}
                        disabled={isLoading(event.id)}
                        title={
                          isSubscribed(event.id)
                            ? "Turn off notifications for this event"
                            : "Notify me when this tournament goes live"
                        }
                        aria-label={
                          isSubscribed(event.id)
                            ? `Disable notifications for ${event.name}`
                            : `Notify me when ${event.name} goes live`
                        }
                        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all ${
                          isSubscribed(event.id)
                            ? "border-accent/50 bg-accent/15 text-accent shadow-[0_0_12px_rgba(255,242,130,0.15)]"
                            : "border-line bg-elevated text-copy-secondary hover:border-accent/40 hover:text-copy-primary"
                        }`}
                      >
                        {isLoading(event.id) ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isSubscribed(event.id) ? (
                          <>
                            <BellRing className="h-3.5 w-3.5 text-accent" />
                            <span>Notified</span>
                          </>
                        ) : (
                          <>
                            <Bell className="h-3.5 w-3.5" />
                            <span>Notify Me</span>
                          </>
                        )}
                      </button>
                      {event.status === "live" && (
                        <button className="cursor-pointer rounded-2xl bg-accent px-3 py-2 text-xs font-bold">
                          {"Watch Now >"}
                        </button>
                      )}
                      {event.bracketUrl && (
                        <a href={event.bracketUrl} target="_blank" rel="noopener noreferrer">
                          <button className="flex cursor-pointer items-center rounded-2xl bg-elevated py-2 pr-2 pl-4 text-xs font-bold text-copy-secondary">
                            Bracket
                            <SquareArrowOutUpRight aria-hidden="true" className="h-3" />
                          </button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
