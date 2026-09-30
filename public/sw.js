/// <reference lib="webworker" />

// ---------------------------------------------------------------------------
// SetPlay Service Worker
// Manages push notification receipts, background alerts, and notification clicks.
// ---------------------------------------------------------------------------

self.addEventListener("install", () => {
  // Activate immediately without waiting for existing clients to close
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Become the controller for all active client tabs immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {
    title: "SetPlay Tournament Alert",
    body: "A tournament event you follow is now live!",
    icon: "/logo192.png",
    badge: "/favicon.ico",
    data: { url: "/events" },
    tag: "setplay-event-alert",
  };

  try {
    const json = event.data.json();
    payload = {
      title: json.title || payload.title,
      body: json.body || payload.body,
      icon: json.icon || payload.icon,
      badge: json.badge || payload.badge,
      data: json.data || (json.url ? { url: json.url } : payload.data),
      tag: json.tag || (json.eventId ? `setplay-event-${json.eventId}` : payload.tag),
    };
  } catch {
    const text = event.data.text();
    if (text) {
      payload.body = text;
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    data: payload.data,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url || "/events";
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If an existing SetPlay window is already open, focus and navigate it
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return client.focus();
          }
        }

        // Alternatively focus any open SetPlay tab and navigate to targetUrl
        for (const client of clientList) {
          if ("focus" in client && "navigate" in client) {
            client.focus();
            return client.navigate(targetUrl);
          }
        }

        // Otherwise open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

self.addEventListener("pushsubscriptionchange", () => {
  // Browser or push service refreshed the subscription
  // Best-effort attempt to re-subscribe if options are preserved
  console.info("[SW] Push subscription changed/expired by browser.");
});
