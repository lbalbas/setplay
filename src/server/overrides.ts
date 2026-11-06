import { createServerFn } from "@tanstack/react-start";
import { checkAdminAuth } from "./auth";
import { z } from "zod";
import { getWorkerEnv } from "./env";
import { createDb, events } from "./db";
import { eq } from "drizzle-orm";
import { PRIORITY_WEIGHT, StreamPrioritySchema } from "./matching";
import type { MatchedStream } from "./matching";
export type OverrideDurationOption = "event_end" | "stream_session" | "4h" | "12h" | "24h";

export const OverrideDurationOptionSchema = z.enum([
  "event_end",
  "stream_session",
  "4h",
  "12h",
  "24h",
]);

export const StreamOverrideRecordSchema = z.object({
  eventId: z.string().nullish(),
  eventName: z.string().nullish(),
  priority: StreamPrioritySchema,
  createdAt: z.number(),
  expiresAt: z.number().nullish(),
  streamSessionStartedAt: z.string().nullish(),
});
export const StreamOverridesMapSchema = z.record(z.string(), StreamOverrideRecordSchema);

const overrideInput = z.object({
  streamId: z.string().min(1),
  streamName: z.string().min(1),
  eventId: z.string().min(1).nullish(),
  priority: StreamPrioritySchema,
  durationOption: OverrideDurationOptionSchema,
  streamStartedAt: z.string().min(1),
});

export type StreamOverrideRecord = z.infer<typeof StreamOverrideRecordSchema>;
export type StreamOverridesMap = z.infer<typeof StreamOverridesMapSchema>;

export const saveStreamOverride = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof overrideInput>) => overrideInput.parse(data))
  .handler(async ({ data, context }) => {
    const env = await getWorkerEnv(context);
    const { authenticated } = await checkAdminAuth(context);

    if (!authenticated) {
      throw new Error("Unauthorized");
    }
    if (!env?.KV) {
      throw new Error("KV binding not available");
    }

    const now = Date.now();
    let expiresAt: number | null = null;

    if (data.durationOption === "4h") expiresAt = now + 4 * 60 * 60 * 1000;
    else if (data.durationOption === "12h") expiresAt = now + 12 * 60 * 60 * 1000;
    else if (data.durationOption === "24h") expiresAt = now + 24 * 60 * 60 * 1000;

    let eventName: string | null = null;
    if (data.eventId && env.DB) {
      const db = createDb(env.DB);
      const [ev] = await db
        .select({ name: events.name, endDate: events.endDate })
        .from(events)
        .where(eq(events.id, data.eventId));

      eventName = ev?.name ?? null;
      if (data.durationOption === "event_end") {
        expiresAt = ev?.endDate ? new Date(ev.endDate).getTime() : now + 24 * 60 * 60 * 1000;
      }
    } else if (data.durationOption === "event_end") {
      expiresAt = now + 24 * 60 * 60 * 1000;
    }

    const overrides = await getOverridesFromKV(env.KV);

    if (data.priority === "headline") {
      for (const key of Object.keys(overrides)) {
        if (overrides[key].priority === "headline" && key !== data.streamId) {
          overrides[key].priority = "normal";
        }
      }
    }
    overrides[data.streamId] = {
      eventId: data.eventId ?? null,
      eventName,
      priority: data.priority,
      createdAt: now,
      expiresAt,
      streamSessionStartedAt:
        data.durationOption === "stream_session" ? data.streamStartedAt : null,
    };
    await env.KV.put("stream_overrides", JSON.stringify(overrides));
    const rawLive = await env.KV.get("live_streams");
    if (rawLive) {
      try {
        const streams = JSON.parse(rawLive) as MatchedStream[];
        const target = streams.find(
          (s) => s.id === data.streamId || s.streamName === data.streamName,
        );
        if (target) {
          target.priority = data.priority;
          if (data.eventId) {
            target.streamType = "tournament";
            target.matchedEvent = {
              eventId: data.eventId,
              eventName: eventName ?? target.matchedEvent?.eventName ?? "Tournament",
              eventSlug: target.matchedEvent?.eventSlug ?? "",
              matchSource: "channel_registry",
              confidence: 1.0,
            };
          } else {
            target.streamType = "casual";
            target.matchedEvent = null;
          }

          // If the new override is headline, demote any other headline streams to normal
          if (data.priority === "headline") {
            for (const s of streams) {
              if (s.priority === "headline" && s.id !== data.streamId) {
                s.priority = "normal";
              }
            }
          }

          // Re-sort: headline first, then featured, then viewer count
          streams.sort((a, b) => {
            const weightDiff =
              (PRIORITY_WEIGHT[b.priority ?? "normal"] ?? 1) -
              (PRIORITY_WEIGHT[a.priority ?? "normal"] ?? 1);
            if (weightDiff !== 0) return weightDiff;
            return b.viewerCount - a.viewerCount;
          });

          await env.KV.put("live_streams", JSON.stringify(streams));
        }
      } catch (err) {
        console.error("[saveStreamOverride] Error hot-patching live_streams:", err);
      }
    }

    return { success: true };
  });

const removeInput = z.object({
  streamId: z.string().min(1),
});

export const removeStreamOverride = createServerFn({ method: "POST" })
  .validator((data: z.infer<typeof removeInput>) => removeInput.parse(data))
  .handler(async ({ data, context }) => {
    const env = await getWorkerEnv(context);
    const { authenticated } = await checkAdminAuth(context);

    if (!authenticated) throw new Error("Unauthorized");
    if (!env?.KV) throw new Error("KV binding not available");

    const overrides = await getOverridesFromKV(env.KV);

    if (overrides[data.streamId]) {
      delete overrides[data.streamId];
      await env.KV.put("stream_overrides", JSON.stringify(overrides));
    }

    // Optional: Hot-patch live_streams to remove override priority
    const rawLive = await env.KV.get("live_streams");
    if (rawLive) {
      try {
        const streams = JSON.parse(rawLive) as MatchedStream[];
        const target = streams.find((s) => s.id === data.streamId);
        if (target) {
          target.priority = "normal";
          streams.sort((a, b) => {
            const weightDiff =
              (PRIORITY_WEIGHT[b.priority ?? "normal"] ?? 1) -
              (PRIORITY_WEIGHT[a.priority ?? "normal"] ?? 1);
            if (weightDiff !== 0) return weightDiff;
            return b.viewerCount - a.viewerCount;
          });
          await env.KV.put("live_streams", JSON.stringify(streams));
        }
      } catch (err) {
        console.error("[removeStreamOverride] Error hot-patching live_streams:", err);
      }
    }

    return { success: true };
  });

export const getStreamOverrides = createServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<StreamOverridesMap> => {
    const env = await getWorkerEnv(context);
    const { authenticated } = await checkAdminAuth(context);
    if (!authenticated || !env?.KV) return {};

    const overrides = await getOverridesFromKV(env.KV);
    return overrides ?? {};
  },
);

export async function getOverridesFromKV(kv: KVNamespace): Promise<StreamOverridesMap> {
  try {
    const raw = await kv.get("stream_overrides", "json");
    if (!raw) return {};

    const parsed = StreamOverridesMapSchema.safeParse(raw);
    if (parsed.success) {
      return parsed.data;
    }

    console.warn(
      "[getOverridesFromKV] Invalid schema in KV, falling back to empty map:",
      parsed.error,
    );
    return {};
  } catch (err) {
    console.error("[getOverridesFromKV] Failed reading overrides from KV:", err);
    return {};
  }
}
