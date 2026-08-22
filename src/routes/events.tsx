import { createFileRoute } from "@tanstack/react-router";
import { MOCK_EVENTS, MOCK_GAMES } from "#/mocks/data";
import {
  Funnel,
  MapPin,
  Wifi,
  Calendar,
  UsersRound,
  Trophy,
  SquareArrowOutUpRight,
} from "lucide-react";

export const Route = createFileRoute("/events")({ component: EventPage });

function EventPage() {
  const liveEvents = MOCK_EVENTS.filter((event) => event.status === "live").length;
  const upcomingEvents = MOCK_EVENTS.filter((event) => event.status === "upcoming").length;

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
              <div className="font-serif text-2xl font-bold text-copy-primary">
                {MOCK_EVENTS.length}
              </div>
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
      <div className="mx-auto w-10/12 max-w-7xl py-8">
        <div className="flex w-full gap-8 rounded-lg border border-accent-glow bg-surface px-6 py-4 text-copy-secondary">
          <span className="flex items-center text-sm text-copy-secondary uppercase">
            <Funnel aria-hidden="true" className="h-4" />
            <span className="ml-1">Filters</span>
          </span>
          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label="Event location filters"
              className="flex items-center gap-2 border-r border-accent-glow text-sm"
            >
              <button
                type="button"
                className="rounded-xl bg-elevated px-3 py-1 transition-colors hover:text-copy-primary"
              >
                All
              </button>
              <button
                type="button"
                className="flex items-center rounded-xl bg-elevated px-3 py-1 transition-colors hover:text-copy-primary"
              >
                <Wifi aria-hidden="true" className="h-3" />
                <span className="ml-1">Online</span>
              </button>
              <button
                type="button"
                className="flex items-center rounded-xl bg-elevated px-3 py-1 transition-colors hover:text-copy-primary"
              >
                <MapPin aria-hidden="true" className="h-3" />
                <span className="ml-1">Offline</span>
              </button>
            </div>
            <div role="group" aria-label="Event status filters" className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  className="rounded-xl px-3 py-1 transition-colors hover:text-copy-primary"
                >
                  All Status
                </button>
                <button
                  type="button"
                  className="rounded-xl px-3 py-1 transition-colors hover:text-copy-primary"
                >
                  Ongoing
                </button>
                <button
                  type="button"
                  className="rounded-xl px-3 py-1 transition-colors hover:text-copy-primary"
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  className="rounded-xl px-3 py-1 transition-colors hover:text-copy-primary"
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto flex w-10/12 flex-col gap-4 py-8">
          {MOCK_EVENTS.map((event) => (
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
                    <span className="inline-flex items-center gap-1 rounded border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-accent uppercase shadow-[0_0_8px_rgba(255,242,130,0.15),_0_0_20px_rgba(255,242,130,0.08)]">
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
                  {event.status === "live" && (
                    <button className="cursor-pointer rounded-2xl bg-accent px-3 py-2 text-xs font-bold">
                      {"Watch Now >"}
                    </button>
                  )}
                  <button className="flex cursor-pointer items-center rounded-2xl bg-elevated py-2 pr-2 pl-4 text-xs font-bold text-copy-secondary">
                    Bracket
                    <SquareArrowOutUpRight aria-hidden="true" className="h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
