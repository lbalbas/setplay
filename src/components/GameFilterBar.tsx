import { useLoaderData } from "@tanstack/react-router";
import { useGameFilter } from "#/context/GameFilterContext";
import type { Game } from "#/server/db/schema";

interface GameFilterBarProps {
  games?: Game[];
}

export default function GameFilterBar({ games: propGames }: GameFilterBarProps) {
  const rootGames = useLoaderData({ from: "__root__" }) as Game[];
  const games = propGames ?? rootGames ?? [];
  const { selectedGame, setSelectedGame } = useGameFilter();

  return (
    <div
      role="group"
      aria-label="Game filters"
      className="flex scrollbar-none items-center gap-2 overflow-x-auto py-1"
    >
      {/* "All" Pill */}
      <button
        type="button"
        onClick={() => setSelectedGame("all")}
        aria-pressed={selectedGame === "all"}
        className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors duration-150 ${
          selectedGame === "all"
            ? "bg-accent text-black shadow-sm"
            : "border border-[#2a2a22] bg-[#181814] text-[#a0a095] hover:bg-[#22221c] hover:text-white"
        }`}
      >
        All
      </button>

      {/* Game Pills */}
      {games.map((game) => {
        const isSelected = selectedGame === game.id || selectedGame === game.slug;
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => setSelectedGame(game.id)}
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
    </div>
  );
}
