import { useState, useRef, useEffect } from "react";
import { useLoaderData } from "@tanstack/react-router";
import { ChevronDown, Check } from "lucide-react";
import { useGameFilter } from "#/context/GameFilterContext";
import type { Game } from "#/server/db/schema";

interface GameFilterBarProps {
  games?: Game[];
  featuredCount?: number;
}

export default function GameFilterBar({
  games: propGames,
  featuredCount = 4,
}: GameFilterBarProps) {
  const rootGames = useLoaderData({ from: "__root__" }) as Game[];
  const games = propGames ?? rootGames ?? [];
  const { selectedGame, setSelectedGame } = useGameFilter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Split games into top featured pills and overflow list
  const featuredGames = games.slice(0, featuredCount);
  const overflowGames = games.slice(featuredCount);

  // Check if current selection is inside overflow games
  const selectedOverflowGame = overflowGames.find(
    (g) => g.id === selectedGame || g.slug === selectedGame
  );
  const isOverflowActive = Boolean(selectedOverflowGame);

  return (
    <div
      role="group"
      aria-label="Game filters"
      className="relative flex items-center gap-2 py-1"
    >
      {/* "All" Pill */}
      <button
        type="button"
        onClick={() => {
          setSelectedGame("all");
          setIsOpen(false);
        }}
        aria-pressed={selectedGame === "all"}
        className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors duration-150 ${
          selectedGame === "all"
            ? "bg-accent text-black shadow-sm"
            : "border border-[#2a2a22] bg-[#181814] text-[#a0a095] hover:bg-[#22221c] hover:text-white"
        }`}
      >
        All
      </button>

      {/* Featured Game Pills */}
      {featuredGames.map((game) => {
        const isSelected = selectedGame === game.id || selectedGame === game.slug;
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => {
              setSelectedGame(game.id);
              setIsOpen(false);
            }}
            aria-pressed={isSelected}
            className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition-colors duration-150 ${
              isSelected
                ? "bg-accent font-semibold text-black shadow-sm"
                : "border border-[#2a2a22] bg-[#181814] text-[#a0a095] hover:bg-[#22221c] hover:text-white"
            }`}
          >
            {game.slug.toUpperCase()}
          </button>
        );
      })}

      {/* "+ More" Dropdown Button */}
      {overflowGames.length > 0 && (
        <div ref={dropdownRef} className="relative inline-block">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="true"
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium transition-colors duration-150 ${
              isOverflowActive
                ? "bg-accent font-semibold text-black shadow-sm"
                : "border border-[#2a2a22] bg-[#181814] text-[#a0a095] hover:bg-[#22221c] hover:text-white"
            }`}
          >
            <span>
              {selectedOverflowGame
                ? selectedOverflowGame.slug.toUpperCase()
                : `+ More (${overflowGames.length})`}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform duration-150 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div
              role="menu"
              className="absolute left-0 z-50 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-[#2a2a22] bg-[#141411] p-1.5 shadow-xl backdrop-blur-md scrollbar-none"
            >
              {overflowGames.map((game) => {
                const isSelected = selectedGame === game.id || selectedGame === game.slug;
                return (
                  <button
                    key={game.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSelectedGame(game.id);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
                      isSelected
                        ? "bg-accent/15 font-semibold text-accent"
                        : "text-[#a0a095] hover:bg-[#22221c] hover:text-white"
                    }`}
                  >
                    <span>{game.name}</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono opacity-80">
                      {game.slug.toUpperCase()}
                      {isSelected && <Check aria-hidden="true" className="h-3 w-3 text-accent" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
