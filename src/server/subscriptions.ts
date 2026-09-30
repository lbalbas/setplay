import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createDb } from "./db";
import { pushSubscriptions, subscriptionInterests } from "./db/schema";
import { getWorkerEnv } from "./env";
import { EventSubscriptionInputSchema, getSubscriptionId } from "./push";

// ---------------------------------------------------------------------------
// Server Functions: Push Subscriptions & Event Interests
// ---------------------------------------------------------------------------

/**
 * Returns the VAPID Public Key for client-side subscription generation.
 */
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(
  async ({ context }) => {
    const env = await getWorkerEnv(context);
    return {
      publicKey: env?.VAPID_PUBLIC_KEY ?? "",
    };
  },
);

/**
 * Toggles a user's subscription interest for a specific tournament event.
 * If already subscribed, unregisters the interest. If not subscribed, registers it.
 */
export const toggleEventSubscription = createServerFn({ method: "POST" })
  .validator((data: unknown) => EventSubscriptionInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const env = await getWorkerEnv(context);
    if (!env?.DB) {
      throw new Error("D1 database binding not available");
    }

    const db = createDb(env.DB);
    const subscriptionId = getSubscriptionId(data.subscription.endpoint);

    // 1. Ensure the push subscription record is registered/updated in D1
    await db
      .insert(pushSubscriptions)
      .values({
        id: subscriptionId,
        endpoint: data.subscription.endpoint,
        p256dh: data.subscription.keys.p256dh,
        auth: data.subscription.keys.auth,
        createdAt: new Date(),
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.id,
        set: {
          endpoint: data.subscription.endpoint,
          p256dh: data.subscription.keys.p256dh,
          auth: data.subscription.keys.auth,
        },
      });

    // 2. Check if interest already exists for this event
    const existing = await db
      .select({ id: subscriptionInterests.id })
      .from(subscriptionInterests)
      .where(
        and(
          eq(subscriptionInterests.subscriptionId, subscriptionId),
          eq(subscriptionInterests.interestType, "event"),
          eq(subscriptionInterests.targetId, data.eventId),
        ),
      );

    if (existing.length > 0) {
      // Unsubscribe from this event
      await db
        .delete(subscriptionInterests)
        .where(
          and(
            eq(subscriptionInterests.subscriptionId, subscriptionId),
            eq(subscriptionInterests.interestType, "event"),
            eq(subscriptionInterests.targetId, data.eventId),
          ),
        );

      return { subscribed: false, eventId: data.eventId };
    }

    // Subscribe to this event
    await db.insert(subscriptionInterests).values({
      subscriptionId,
      interestType: "event",
      targetId: data.eventId,
    });

    return { subscribed: true, eventId: data.eventId };
  });

const EndpointQuerySchema = z.object({
  endpoint: z.string().url(),
});

/**
 * Retrieves the list of event IDs currently subscribed to by a browser endpoint.
 */
export const getEventSubscriptionsForEndpoint = createServerFn({ method: "POST" })
  .validator((data: unknown) => EndpointQuerySchema.parse(data))
  .handler(async ({ data, context }) => {
    const env = await getWorkerEnv(context);
    if (!env?.DB) {
      return { eventIds: [] };
    }

    const db = createDb(env.DB);
    const subscriptionId = getSubscriptionId(data.endpoint);

    const interests = await db
      .select({
        targetId: subscriptionInterests.targetId,
      })
      .from(subscriptionInterests)
      .where(
        and(
          eq(subscriptionInterests.subscriptionId, subscriptionId),
          eq(subscriptionInterests.interestType, "event"),
        ),
      );

    return {
      eventIds: interests.map((i) => i.targetId),
    };
  });
