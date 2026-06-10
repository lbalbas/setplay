# SetPlay — Database Schema & Models

This document defines the schema models that will be written into `src/server/db/schema.ts` for Drizzle ORM and Cloudflare D1.

---

## 1. Games Table (`games`)
Tracks the individual fighting games we support (e.g., Street Fighter 6, Tekken 8).

```typescript
export const games = sqliteTable("games", {
  id: text("id").primaryKey(),                 // Twitch Game ID (numeric string, e.g., "518605")
  name: text("name").notNull(),                // Game name (e.g., "Street Fighter 6")
  slug: text("slug").notNull().unique(),        // URL-friendly slug (e.g., "sf6")
  startggId: integer("startgg_id"),            // videogameId in start.gg API
});
```

---

## 2. Events Table (`events`)
Tracks the tournament events.

```typescript
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),                 // Unique UUID or slug-based ID
  name: text("name").notNull(),                // Tournament name (e.g., "Combo Breaker 2026")
  slug: text("slug").notNull().unique(),        // URL slug (e.g., "combo-breaker-2026")
  source: text("source", { enum: ["start_gg", "manual"] }).notNull(),
  startggSlug: text("startgg_slug"),           // start.gg slug if auto-imported (e.g., "tournament/combo-breaker-2026")
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  region: text("region"),                      // geographical region (e.g., "NA", "EU", "JP")
  isOnline: integer("is_online", { mode: "boolean" }).notNull().default(false),
  registrationUrl: text("registration_url"),
  featuredPriority: text("featured_priority", { enum: ["normal", "featured", "headline"] }).notNull().default("normal"),
  status: text("status", { enum: ["upcoming", "live", "completed"] }).notNull().default("upcoming"),
});
```

---

## 3. Event Games Table (`event_games`)
Junction table mapping the many-to-many relationship between tournaments and games.

```typescript
export const eventGames = sqliteTable("event_games", {
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  gameId: text("game_id").references(() => games.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.eventId, t.gameId] }),
}));
```

---

## 4. Push Subscriptions Table (`push_subscriptions`)
Stores Web Push keys for user browser alerts.

```typescript
export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id").primaryKey(),                 // Hash of the endpoint URL (for fast lookups)
  endpoint: text("endpoint").notNull(),        // Push API endpoint URL
  p256dh: text("p256dh").notNull(),            // Client public key
  auth: text("auth").notNull(),                // Auth secret key
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
```

---

## 5. Subscription Interests Table (`subscription_interests`)
Maps push subscriptions to specific games or events they want live alerts for.

```typescript
export const subscriptionInterests = sqliteTable("subscription_interests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscriptionId: text("subscription_id").references(() => pushSubscriptions.id, { onDelete: "cascade" }),
  interestType: text("interest_type", { enum: ["game", "event"] }).notNull(),
  targetId: text("target_id").notNull(),        // References either game.id or event.id
});
```
