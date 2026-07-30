import { MOCK_GAMES } from "#/mocks/data";

interface GameFilterBarProps {
  selectedGame: string;
  onSelectGame: (gameId: string) => void;
  games?: typeof MOCK_GAMES;
}

export default function GameFilterBar({
  selectedGame,
  onSelectGame,
  games = MOCK_GAMES,
}: GameFilterBarProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
      {/* "All" Pill */}
      <button
        type="button"
        onClick={() => onSelectGame("all")}
        className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-colors duration-150 ${
          selectedGame === "all"
            ? "bg-accent text-black shadow-sm"
            : "bg-[#181814] text-[#a0a095] hover:bg-[#22221c] hover:text-white border border-[#2a2a22]"
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
            onClick={() => onSelectGame(game.id)}
            className={`shrink-0 rounded-full px-3.5 py-1 text-xs font-medium transition-colors duration-150 ${
              isSelected
                ? "bg-accent text-black font-semibold shadow-sm"
                : "bg-[#181814] text-[#a0a095] hover:bg-[#22221c] hover:text-white border border-[#2a2a22]"
            }`}
          >
            {game.slug.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
