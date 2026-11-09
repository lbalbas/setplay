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
export const getVapidPublicKey = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  const env = await getWorkerEnv(context);
  return {
    publicKey: env?.VAPID_PUBLIC_KEY ?? "",
  };
});

/**
 * Toggles a user's subscription interest for a specific tournament event.
 * If already subscribed, unregisters the interest. If not subscribed, registers it.
 */
export const toggleEventSubscription = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    try {
      return EventSubscriptionInputSchema.parse(data);
    } catch (validationError) {
      console.error("[toggleEventSubscription] Schema validation failed:", {
        error: validationError,
        receivedData: data,
      });
      throw validationError;
    }
  })
  .handler(async ({ data, context }) => {
    console.log("[toggleEventSubscription] Processing request:", {
      eventId: data?.eventId,
      endpoint: data?.subscription?.endpoint?.slice(0, 30) + "...", // Truncated for security
    });

    try {
      const env = await getWorkerEnv(context);
      if (!env?.DB) {
        console.error(
          "[toggleEventSubscription] Error: DB binding missing on Cloudflare Worker env context.",
        );
        throw new Error("D1 database binding not available");
      }

      const db = createDb(env.DB);

      // Verify endpoint and keys exist to avoid silent undefined DB errors
      if (
        !data.subscription?.endpoint ||
        !data.subscription?.keys?.p256dh ||
        !data.subscription?.keys?.auth
      ) {
        console.error("[toggleEventSubscription] Error: Missing required subscription fields:", {
          hasEndpoint: !!data.subscription?.endpoint,
          hasP256dh: !!data.subscription?.keys?.p256dh,
          hasAuth: !!data.subscription?.keys?.auth,
        });
        throw new Error("Invalid Push Subscription payload structure");
      }

      const subscriptionId = await getSubscriptionId(data.subscription.endpoint);
      console.log(`[toggleEventSubscription] Computed subscriptionId: ${subscriptionId}`);

      // 1. Ensure push subscription record is registered/updated
      console.log("[toggleEventSubscription] Upserting push subscription record...");
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
      console.log("[toggleEventSubscription] Push subscription upserted successfully.");

      // 2. Check if interest already exists for this event
      console.log("[toggleEventSubscription] Querying existing subscription interest...");
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
        // Unsubscribe
        console.log(
          `[toggleEventSubscription] Interest found (id: ${existing[0].id}). Deleting interest...`,
        );
        await db
          .delete(subscriptionInterests)
          .where(
            and(
              eq(subscriptionInterests.subscriptionId, subscriptionId),
              eq(subscriptionInterests.interestType, "event"),
              eq(subscriptionInterests.targetId, data.eventId),
            ),
          );

        console.log(
          `[toggleEventSubscription] Successfully unsubscribed from event ${data.eventId}`,
        );
        return { subscribed: false, eventId: data.eventId };
      }

      // Subscribe
      console.log(
        `[toggleEventSubscription] No interest found. Creating subscription interest for event ${data.eventId}...`,
      );
      await db.insert(subscriptionInterests).values({
        subscriptionId,
        interestType: "event",
        targetId: data.eventId,
      });

      console.log(`[toggleEventSubscription] Successfully subscribed to event ${data.eventId}`);
      return { subscribed: true, eventId: data.eventId };
    } catch (error) {
      console.error("[toggleEventSubscription] Handler execution failed:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        errorObject: error,
      });

      // Re-throw so the server function caller handles the error status properly
      throw error;
    }
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
    const subscriptionId = await getSubscriptionId(data.endpoint);

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
