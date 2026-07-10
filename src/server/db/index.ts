import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// ---------------------------------------------------------------------------
// Cloudflare Workers environment bindings type
// Generated automatically by `pnpm cf:types` (wrangler types).
// The Env interface is augmented by wrangler at build time.
// ---------------------------------------------------------------------------
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  // Secrets (set via `wrangler secret put`)
  TWITCH_CLIENT_ID: string;
  TWITCH_CLIENT_SECRET: string;
  STARTGG_API_TOKEN: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ADMIN_TOKEN: string;
}

// ---------------------------------------------------------------------------
// createDb
// Call this inside a Worker request/cron handler, passing in the D1 binding.
// ---------------------------------------------------------------------------
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// Re-export schema for convenience
export * from "./schema";
