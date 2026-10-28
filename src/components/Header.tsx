import { getRouteApi, Link, useLocation } from "@tanstack/react-router";
import { Search } from "lucide-react";
import GameFilterBar from "./GameFilterBar";

const rootRoute = getRouteApi("__root__");

export default function Header() {
  const location = useLocation();
  const currentPath = location?.pathname || "/";
  const { auth } = rootRoute.useRouteContext();
  const isAuthenticated = auth?.isAuthenticated;

  return (
    <header className="sticky top-0 z-50 border-b bg-elevated/95 backdrop-blur-md">
      {/* Top Navbar */}
      <div className="mx-auto flex w-11/12 max-w-screen-2xl items-center justify-between py-3">
        {/* Brand Logo */}
        <div className="flex items-center">
          <Link
            to="/"
            className="flex items-center gap-1.5 font-serif text-2xl font-bold tracking-tight text-white"
          >
            SetPlay
            <span
              aria-hidden="true"
              className="h-2 w-2 animate-pulse rounded-full bg-accent shadow-[0_0_8px_rgba(255,242,130,0.8)]"
            />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="relative mx-6 max-w-md flex-1">
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-copy-primary/50"
          />
          <input
            id="search"
            type="text"
            placeholder="Search streams, events, players..."
            aria-label="Search streams, events, and players"
            className="w-full rounded-full border bg-surface py-2 pr-4 pl-10 text-xs text-copy-primary/80 placeholder-copy-primary/50 transition-colors focus:border-accent focus:outline-none"
          />
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell
          <button
            type="button"
            className="relative rounded-full p-2 text-copy-primary/50 transition-colors hover:bg-white/5 hover:text-copy-primary"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell aria-hidden="true" className="h-4 w-4" />
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent shadow-[0_0_6px_rgba(255,242,130,0.9)]"
            />
          </button>
          */}
        </div>
      </div>

      {/* Sub-header Bar: Game Filters & Nav Links */}
      <div className="border-t border-accent-glow bg-surface">
        <div className="mx-auto flex w-11/12 max-w-screen-2xl items-center justify-between py-2">
          {/* Game Filter Bar */}
          <div className="mr-4 min-w-0 flex-1">
            <GameFilterBar />
          </div>

          {/* Nav Links (Right Side) */}
          <nav className="flex shrink-0 items-center gap-5 text-xs font-semibold">
            <Link
              to="/"
              className={`relative py-1 transition-colors ${
                currentPath === "/"
                  ? "font-bold text-copy-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-accent"
                  : "text-copy-primary/50 hover:text-copy-primary"
              }`}
            >
              Streams
            </Link>
            <Link
              to="/events"
              className={`relative py-1 transition-colors ${
                currentPath === "/events"
                  ? "font-bold text-copy-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-accent"
                  : "text-copy-primary/50 hover:text-copy-primary"
              }`}
            >
              Events
            </Link>
            {isAuthenticated && (
              <Link
                to="/admin"
                className={`relative py-1 transition-colors ${
                  currentPath === "/admin"
                    ? "font-bold text-copy-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-accent"
                    : "text-copy-primary/50 hover:text-copy-primary"
                }`}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
