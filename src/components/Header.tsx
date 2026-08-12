import { Link, useLocation } from "@tanstack/react-router";
import { Bell, Search, Shield, Zap } from "lucide-react";
import GameFilterBar from "./GameFilterBar";
import { useGameFilter } from "#/context/GameFilterContext";

interface HeaderProps {
  selectedGame?: string;
  onSelectGame?: (gameId: string) => void;
}

export default function Header({
  selectedGame: propSelectedGame,
  onSelectGame: propOnSelectGame,
}: HeaderProps) {
  const location = useLocation();
  const currentPath = location?.pathname || "/";
  const { selectedGame: contextSelectedGame, setSelectedGame: contextSetSelectedGame } =
    useGameFilter();

  const selectedGame = propSelectedGame ?? contextSelectedGame;
  const handleSelectGame = propOnSelectGame ?? contextSetSelectedGame;

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
          {/* Notification Bell */}
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

          {/* Admin Pill */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1.5 text-xs font-semibold text-copy-secondary transition-colors hover:border-accent-glow hover:text-copy-primary"
          >
            <Shield aria-hidden="true" className="h-3.5 w-3.5 text-copy-primary/50" />
            <span>ADMIN</span>
          </Link>

          {/* User Profile Pill */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-glow bg-surface p-1 pr-3 text-xs font-semibold text-white">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent font-bold text-black">
              <Zap aria-hidden="true" className="h-3.5 w-3.5 fill-black" />
            </span>
            <span>NuckleDu</span>
          </div>
        </div>
      </div>

      {/* Sub-header Bar: Game Filters & Nav Links */}
      <div className="border-t border-accent-glow bg-surface">
        <div className="mx-auto flex w-11/12 max-w-screen-2xl items-center justify-between py-2">
          {/* Game Filter Bar */}
          <div className="mr-4 min-w-0 flex-1">
            <GameFilterBar selectedGame={selectedGame} onSelectGame={handleSelectGame} />
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
            <Link
              to="/"
              className={`relative py-1 transition-colors ${
                currentPath.startsWith("/admin")
                  ? "font-bold text-copy-primary after:absolute after:right-0 after:bottom-0 after:left-0 after:h-0.5 after:bg-accent"
                  : "text-copy-primary/50 hover:text-copy-primary"
              }`}
            >
              Admin
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
