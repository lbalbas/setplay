import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import type { Env } from "./db";
import { handleCronTrigger } from "./cron";

const serverEntry = createServerEntry({
  async fetch(request, env, ctx) {
    return await handler.fetch(request, env, ctx);
  },
});

export default {
  ...serverEntry,
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleCronTrigger(event, env));
  },
};
