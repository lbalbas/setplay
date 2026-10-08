import { useState, useEffect, useCallback } from "react";
import {
  checkPushSupport,
  registerServiceWorker,
  urlBase64ToUint8Array,
  serializePushSubscription,
} from "../utils/push";
import {
  getVapidPublicKey,
  toggleEventSubscription,
  getEventSubscriptionsForEndpoint,
} from "../server/subscriptions";

const STORAGE_KEY = "setplay_event_subscriptions";

export function useEventPushSubscription() {
  const [subscribedEventIds, setSubscribedEventIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [loadingEventId, setLoadingEventId] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (!checkPushSupport()) return "unsupported";
    return Notification.permission;
  });

  // Save to localStorage whenever state changes
  const updateSubscriptions = useCallback((updater: (prev: Set<string>) => Set<string>) => {
    setSubscribedEventIds((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn("[Push] Failed to persist subscription to localStorage:", err);
      }
      return next;
    });
  }, []);

  // Background service worker registration and initial sync
  useEffect(() => {
    if (!checkPushSupport()) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission);

    // Warm up service worker registration
    registerServiceWorker().then(async (reg) => {
      if (!reg) return;

      // Sync active server interests if browser already has an active subscription
      try {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          const res = await getEventSubscriptionsForEndpoint({
            data: { endpoint: sub.endpoint },
          });
          if (res?.eventIds) {
            updateSubscriptions(() => new Set(res.eventIds));
          }
        }
      } catch (syncErr) {
        console.warn("[Push] Initial endpoint sync skipped:", syncErr);
      }
    });
  }, [updateSubscriptions]);

  const toggleSubscription = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!checkPushSupport()) {
        alert("Push notifications are not supported in your browser.");
        return false;
      }

      setLoadingEventId(eventId);

      try {
        // 1. Request notification permissions
        const currentPerm = await Notification.requestPermission();
        setPermission(currentPerm);

        if (currentPerm !== "granted") {
          alert(
            "Notification permission was denied. Please enable notifications in your browser settings.",
          );
          return false;
        }

        // 2. Fetch VAPID public key
        const { publicKey } = await getVapidPublicKey();
        if (!publicKey) {
          alert("Push notification service is not configured (missing VAPID public key).");
          return false;
        }

        // 3. Ensure service worker is registered and ready
        await registerServiceWorker();
        const registration = await navigator.serviceWorker.ready;

        // 4. Retrieve or create push subscription
        let subscription = await registration.pushManager.getSubscription();

        console.log("[Push] Existing subscription found:", !!subscription);
        console.log("[Push] Raw VAPID key fetched:", publicKey);

        const applicationServerKey = urlBase64ToUint8Array(publicKey);

        if (!subscription) {
          console.log("[Push] Attempting pushManager.subscribe...");
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey as unknown as BufferSource,
            });
          } catch (subErr) {
            console.error("[Push] pushManager.subscribe directly threw error:", subErr);

            // If stalled/mismatched, attempt to unsubscribe stale sub and retry once
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
              console.log("[Push] Clearing stale subscription and retrying...");
              await existingSub.unsubscribe();
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as unknown as BufferSource,
              });
            } else {
              throw subErr;
            }
          }
        }

        const serialized = serializePushSubscription(subscription);
        if (!serialized) {
          throw new Error("Unable to extract keys from push subscription");
        }

        // 5. Send toggle mutation to server
        const result = await toggleEventSubscription({
          data: {
            subscription: serialized,
            eventId,
          },
        });

        // 6. Update local state
        updateSubscriptions((prev) => {
          const next = new Set(prev);
          if (result.subscribed) {
            next.add(eventId);
          } else {
            next.delete(eventId);
          }
          return next;
        });

        return result.subscribed;
      } catch (error) {
        console.error("[Push] Failed to toggle event subscription:", error);
        alert("Failed to update notification subscription. Please try again.");
        return false;
      } finally {
        setLoadingEventId(null);
      }
    },
    [updateSubscriptions],
  );

  const isSubscribed = useCallback(
    (eventId: string) => subscribedEventIds.has(eventId),
    [subscribedEventIds],
  );

  return {
    isSubscribed,
    isLoading: (eventId: string) => loadingEventId === eventId,
    toggleSubscription,
    permission,
    isSupported: permission !== "unsupported",
  };
}
