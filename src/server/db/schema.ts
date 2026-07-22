import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ---------------------------------------------------------------------------
// Games
// Stores the fighting games tracked by the platform.
// id = Twitch Game ID (numeric string, e.g. "518605" for Street Fighter 6)
// ---------------------------------------------------------------------------
export const games = sqliteTable("games", {
  id: text("id").primaryKey(), // Twitch Game ID
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL slug, e.g. "sf6"
  startggId: integer("startgg_id"), // start.gg videogameId for API queries
});

// ---------------------------------------------------------------------------
// Events
// Stores tournament events — auto-ingested from start.gg or manually added.
// ---------------------------------------------------------------------------
export const events = sqliteTable("events", {
  id: text("id").primaryKey(), // UUID or start.gg slug-based ID
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  source: text("source", { enum: ["start_gg", "manual"] }).notNull(),
  startggSlug: text("startgg_slug"), // e.g. "tournament/combo-breaker-2026"
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  region: text("region"), // e.g. "NA", "EU", "JP"
  isOnline: integer("is_online", { mode: "boolean" }).notNull().default(false),
  registrationUrl: text("registration_url"),
  featuredPriority: text("featured_priority", {
    enum: ["normal", "featured", "headline"],
  })
    .notNull()
    .default("normal"),
  status: text("status", {
    enum: ["upcoming", "live", "completed"],
  })
    .notNull()
    .default("upcoming"),
});

// ---------------------------------------------------------------------------
// Event <-> Game junction
// Many-to-many: one tournament can feature multiple games and vice versa.
// ---------------------------------------------------------------------------
export const eventGames = sqliteTable(
  "event_games",
  {
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    gameId: text("game_id")
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.eventId, t.gameId] }),
  }),
);

// ---------------------------------------------------------------------------
// Push Subscriptions
// Web Push API subscription objects stored per browser/device.
// id = SHA-256 hash of the endpoint URL for deduplication.
// ---------------------------------------------------------------------------
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ---------------------------------------------------------------------------
// Subscription Interests
// Maps a push subscription to the games/events the user wants alerts for.
// ---------------------------------------------------------------------------
export const subscriptionInterests = sqliteTable("subscription_interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => pushSubscriptions.id, { onDelete: "cascade" }),
  interestType: text("interest_type", { enum: ["game", "event"] }).notNull(),
  targetId: text("target_id").notNull(), // game.id or event.id
});

// ---------------------------------------------------------------------------
// Inferred types (for use in server functions and API handlers)
// ---------------------------------------------------------------------------
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type EventGame = typeof eventGames.$inferSelect;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

export type SubscriptionInterest = typeof subscriptionInterests.$inferSelect;
export type NewSubscriptionInterest = typeof subscriptionInterests.$inferInsert;
