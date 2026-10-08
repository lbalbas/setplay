import type { PushSubscriptionPayload } from "../server/push";

/**
 * Converts a URL-safe Base64 VAPID public key string into a Uint8Array
 * required by the browser's PushManager.subscribe() method.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Ensure string stripped of whitespace
  const cleanString = base64String.trim();

  // Calculate required '=' padding
  const padding = "=".repeat((4 - (cleanString.length % 4)) % 4);
  const base64 = (cleanString + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  // Diagnostic check: Uncompressed P-256 public keys MUST be exactly 65 bytes
  if (outputArray.length !== 65) {
    console.error(
      `[Push] Invalid VAPID Key length! Expected 65 bytes, got ${outputArray.length} bytes.`,
    );
  }

  return outputArray;
}

/**
 * Checks whether the current browser environment supports Service Workers and Web Push.
 */
export function checkPushSupport(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Registers the root service worker (/sw.js) and returns the registration.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!checkPushSupport()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.error("[Push] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Retrieves the active PushSubscription from the browser if one already exists.
 */
export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!checkPushSupport()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.warn("[Push] Error fetching existing subscription:", error);
    return null;
  }
}

/**
 * Converts a browser PushSubscription object into a serializable payload
 * with endpoint and Base64-encoded p256dh / auth keys.
 */
export function serializePushSubscription(sub: PushSubscription): PushSubscriptionPayload | null {
  const rawP256dh = sub.getKey("p256dh");
  const rawAuth = sub.getKey("auth");

  if (!rawP256dh || !rawAuth) {
    return null;
  }

  const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawP256dh)));
  const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh,
      auth,
    },
  };
}
