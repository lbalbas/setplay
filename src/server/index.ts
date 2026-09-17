// @ts-ignore - Built by Vite before Wrangler runs
import app from "../../dist/server/server.js";
import type { Env } from "./db";
import { handleCronTrigger } from "./cron";

// ---------------------------------------------------------------------------
// Cloudflare Worker Module Exports
// ---------------------------------------------------------------------------
export default {
  /**
   * HTTP Request Handler
   * Delegates HTTP traffic to TanStack Start's compiled server bundle.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return app.fetch(request, {
      context: {
        env,
        ctx,
      },
    });
  },

  /**
   * Scheduled Cron Handler
   * Triggered automatically by Cloudflare's Cron Scheduler (defined in wrangler.toml).
   * Runs the Twitch + start.gg ingestion & 4-layer matching pipeline.
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCronTrigger(event, env));
  },
};
