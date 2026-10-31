import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

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

  const handleSetGame = (gameId: string) => {
    setSelectedGame(gameId);
    localStorage.setItem("setplay_game_filter", gameId);
  };

  useEffect(() => {
    setSelectedGame(localStorage.getItem("setplay_game_filter") || "all");
  }, []);

  return (
    <GameFilterContext.Provider value={{ selectedGame, setSelectedGame: handleSetGame }}>
      {children}
    </GameFilterContext.Provider>
  );
}

export function useGameFilter() {
  return useContext(GameFilterContext);
}
