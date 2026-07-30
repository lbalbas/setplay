import { createContext, useContext, useState, type ReactNode } from "react";

interface GameFilterContextType {
  selectedGame: string;
  setSelectedGame: (gameId: string) => void;
}

const GameFilterContext = createContext<GameFilterContextType>({
  selectedGame: "all",
  setSelectedGame: () => {},
});

export function GameFilterProvider({ children }: { children: ReactNode }) {
  const [selectedGame, setSelectedGame] = useState<string>("all");

  return (
    <GameFilterContext.Provider value={{ selectedGame, setSelectedGame }}>
      {children}
    </GameFilterContext.Provider>
  );
}

export function useGameFilter() {
  return useContext(GameFilterContext);
}
