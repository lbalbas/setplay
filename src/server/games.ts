import { createServerFn } from "@tanstack/react-start";
import { createDb } from "./db";
import { games } from "./db/schema";
import { getWorkerEnv } from "./env";

export const getGames = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = await getWorkerEnv(context);

  if (!env?.DB) {
    console.warn("[getGames] D1 DB binding not found.");
    return [];
  }

  const db = createDb(env.DB);

  // Query active & upcoming events (from start of today onwards, or all recent)
  const rawGames = await db
    .select({
      game: games,
    })
    .from(games);

  return rawGames.map((row) => row.game);
});
