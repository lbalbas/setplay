import { createServerFn } from "@tanstack/react-start";
import { getWorkerEnv } from "./env";
import { checkAdminAuth } from "./auth";
import type { CronLogEntry } from "./cron";

const getLogs = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = await getWorkerEnv(context);

  if (!env?.KV) {
    console.warn("[getLogs] KV DB binding not found.");
    return [];
  }
  const { authenticated } = await checkAdminAuth(context);

  if (!authenticated) {
    return [];
  }

  const logs = (await env.KV.get("cron_logs", "json")) as CronLogEntry[] | null;
  return logs ?? [];
});

export default getLogs;
