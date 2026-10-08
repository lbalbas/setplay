import { createHash } from "node:crypto";
import { sendNotification as webpushSendNotification } from "web-push-neo";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createDb } from "./db";
import { pushSubscriptions, subscriptionInterests } from "./db/schema";
import type { Env } from "./db";

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

export const PushSubscriptionKeysSchema = z.object({
  p256dh: z.string().min(1, "p256dh key is required"),
  auth: z.string().min(1, "auth secret is required"),
});

export const PushSubscriptionPayloadSchema = z.object({
  endpoint: z.string().url("Endpoint must be a valid URL"),
  keys: PushSubscriptionKeysSchema,
});

export const EventSubscriptionInputSchema = z.object({
  subscription: PushSubscriptionPayloadSchema,
  eventId: z.string().min(1, "eventId is required"),
});

export const EventNotificationPayloadSchema = z.object({
  eventId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
});

export type PushSubscriptionPayload = z.infer<typeof PushSubscriptionPayloadSchema>;
export type EventSubscriptionInput = z.infer<typeof EventSubscriptionInputSchema>;
export type EventNotificationPayload = z.infer<typeof EventNotificationPayloadSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Computes a deterministic SHA-256 hash for a push subscription endpoint URL.
 * Used as the primary key in `push_subscriptions`.
 */
export function getSubscriptionId(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

/**
 * Validates whether all required VAPID credentials exist in the environment.
 */
export function hasValidVapidDetails(env: Env): boolean {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

// ---------------------------------------------------------------------------
// Push Notification Dispatcher
// ---------------------------------------------------------------------------

export interface PushResult {
  success: boolean;
  statusCode?: number;
  pruned?: boolean;
  error?: string;
}

/**
 * Sends a single push notification via web-push-neo (Web Crypto & fetch).
 * If the push service responds with 404 or 410 Gone, immediately deletes the subscription from D1 (Invariant #4).
 */
export async function sendPushNotification(
  db: ReturnType<typeof createDb>,
  env: Env,
  subscription: { id: string; endpoint: string; p256dh: string; auth: string },
  payload: EventNotificationPayload,
): Promise<PushResult> {
  if (!hasValidVapidDetails(env)) {
    console.warn(
      "[Push] VAPID credentials not fully configured (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT).",
    );
    return { success: false, error: "VAPID credentials missing" };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const notificationData = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/logo192.png",
    badge: payload.badge ?? "/favicon.ico",
    data: {
      url: payload.url ?? `/events`,
      eventId: payload.eventId,
    },
    tag: `setplay-event-${payload.eventId}`,
  });

  try {
    const response = await webpushSendNotification(pushSubscription, notificationData, {
      vapidDetails: {
        subject: env.VAPID_SUBJECT,
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY,
      },
    });
    return { success: true, statusCode: response.statusCode };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    const statusCode = error.statusCode;

    // Invariant #4: Expired or failed push endpoints (404 Not Found or 410 Gone)
    // must be immediately deleted from D1 to prevent queue bloat.
    if (statusCode === 404 || statusCode === 410) {
      console.warn(
        `[Push] Endpoint returned ${statusCode} Gone for subscription ${subscription.id.slice(0, 8)}... Pruning from D1.`,
      );
      try {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
        return { success: false, statusCode, pruned: true, error: error.message };
      } catch (deleteErr) {
        console.error(`[Push] Failed to prune subscription ${subscription.id}:`, deleteErr);
      }
    }

    return {
      success: false,
      statusCode,
      error: error.message ?? "Unknown push error",
    };
  }
}

/**
 * Dispatches an event alert to all subscribers registered for a given tournament event ID.
 * Returns statistics summarizing delivery results.
 */
export async function dispatchPushToEventSubscribers(
  db: ReturnType<typeof createDb>,
  env: Env,
  eventId: string,
  payload: EventNotificationPayload,
): Promise<{ sent: number; failed: number; pruned: number }> {
  // Query all subscriptions that have registered an interest for this event
  const subscribers = await db
    .select({
      id: pushSubscriptions.id,
      endpoint: pushSubscriptions.endpoint,
      p256dh: pushSubscriptions.p256dh,
      auth: pushSubscriptions.auth,
    })
    .from(pushSubscriptions)
    .innerJoin(
      subscriptionInterests,
      and(
        eq(subscriptionInterests.subscriptionId, pushSubscriptions.id),
        eq(subscriptionInterests.interestType, "event"),
        eq(subscriptionInterests.targetId, eventId),
      ),
    );

  if (subscribers.length === 0) {
    return { sent: 0, failed: 0, pruned: 0 };
  }

  console.log(
    `[Push Dispatcher] Sending push alerts for event '${eventId}' to ${subscribers.length} subscriber(s)...`,
  );

  const results = await Promise.allSettled(
    subscribers.map((sub) => sendPushNotification(db, env, sub, payload)),
  );

  let sent = 0;
  let failed = 0;
  let pruned = 0;

  for (const res of results) {
    if (res.status === "fulfilled") {
      if (res.value.success) {
        sent++;
      } else {
        failed++;
        if (res.value.pruned) {
          pruned++;
        }
      }
    } else {
      failed++;
    }
  }

  console.log(
    `[Push Dispatcher] Completed event '${eventId}': ${sent} sent, ${failed} failed (${pruned} pruned).`,
  );

  return { sent, failed, pruned };
}
