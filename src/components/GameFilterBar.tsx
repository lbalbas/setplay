import { useState } from "react";
import { MOCK_GAMES } from "#/mocks/data";

type Game = (typeof MOCK_GAMES)[0];

interface GameFilterBarProps {
  onFilter: (games: Game[]) => void;
  initialGames: Game[];
}

export default function GameFilterBar({ onFilter, initialGames }: GameFilterBarProps) {
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);

  const onFilterChange = (game: Game) => {
    const filtered = filteredGames.includes(game)
      ? filteredGames.filter((g) => g !== game)
      : [...filteredGames, game];
    setFilteredGames(filtered);
    onFilter(filtered);
  };

  const clearFilter = () => {
    setFilteredGames([]);
    onFilter(initialGames);
  };

  return (
    <div className="overflow-x-auto min-w-0 h-fit text-xs flex-1 text-accent/60">
      <div className="flex items-center flex-nowrap gap-x-3">
        {/*Clear filter*/}
        <div className="cursor-pointer shrink-0" onClick={() => clearFilter()}>
          X
        </div>
        {initialGames?.map((game) => (
          <span
            className="cursor-pointer shrink-0"
            onClick={() => onFilterChange(game)}
            key={game.id}
          >
            {game.name}
          </span>
        ))}
      </div>
    </div>
  );
}
