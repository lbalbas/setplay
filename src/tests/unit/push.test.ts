import { describe, expect, it, vi, beforeEach } from "vitest";
import { sendNotification as webpushSendNotification } from "web-push-neo";
import {
  getSubscriptionId,
  PushSubscriptionPayloadSchema,
  EventSubscriptionInputSchema,
  EventNotificationPayloadSchema,
  hasValidVapidDetails,
  sendPushNotification,
  dispatchPushToEventSubscribers,
} from "../../server/push";
import type { Env } from "../../server/db";

// Mock web-push-neo
vi.mock("web-push-neo", () => {
  return {
    sendNotification: vi.fn(),
  };
});

describe("Push Notification Utilities & Schemas", () => {
  it("computes deterministic SHA-256 subscription IDs from endpoint URLs", () => {
    const endpoint = "https://fcm.googleapis.com/fcm/send/sample-token-12345";
    const id1 = getSubscriptionId(endpoint);
    const id2 = getSubscriptionId(endpoint);

    expect(id1).toBe(id2);
    expect(id1).toHaveLength(64); // SHA-256 hex string is 64 characters
    expect(typeof id1).toBe("string");

    const differentEndpoint = "https://fcm.googleapis.com/fcm/send/different-token";
    expect(getSubscriptionId(differentEndpoint)).not.toBe(id1);
  });

  it("validates PushSubscriptionPayloadSchema", () => {
    const valid = {
      endpoint: "https://updates.push.services.mozilla.com/wpush/v2/gAAAAABsample",
      keys: {
        p256dh: "BMz-sample-public-key-base64",
        auth: "sample-auth-secret",
      },
    };

    const parsed = PushSubscriptionPayloadSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const invalidEndpoint = {
      endpoint: "not-a-valid-url",
      keys: valid.keys,
    };
    expect(PushSubscriptionPayloadSchema.safeParse(invalidEndpoint).success).toBe(false);

    const missingKey = {
      endpoint: valid.endpoint,
      keys: { p256dh: "" },
    };
    expect(PushSubscriptionPayloadSchema.safeParse(missingKey).success).toBe(false);
  });

  it("validates EventSubscriptionInputSchema", () => {
    const valid = {
      subscription: {
        endpoint: "https://fcm.googleapis.com/fcm/send/token",
        keys: {
          p256dh: "key123",
          auth: "auth123",
        },
      },
      eventId: "evo-2026",
    };

    const parsed = EventSubscriptionInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const missingEventId = {
      ...valid,
      eventId: "",
    };
    expect(EventSubscriptionInputSchema.safeParse(missingEventId).success).toBe(false);
  });

  it("validates EventNotificationPayloadSchema", () => {
    const valid = {
      eventId: "evo-2026",
      title: "EVO 2026 is Live!",
      body: "Stream is now broadcasting finals",
      url: "/events",
    };

    const parsed = EventNotificationPayloadSchema.safeParse(valid);
    expect(parsed.success).toBe(true);

    const missingTitle = {
      ...valid,
      title: "",
    };
    expect(EventNotificationPayloadSchema.safeParse(missingTitle).success).toBe(false);
  });
});

describe("VAPID Validation & Dispatcher (web-push-neo)", () => {
  const mockEnv: Env = {
    DB: {} as any,
    KV: {} as any,
    TWITCH_CLIENT_ID: "mock-twitch-id",
    TWITCH_CLIENT_SECRET: "mock-twitch-secret",
    STARTGG_API_TOKEN: "mock-startgg-token",
    VAPID_PUBLIC_KEY: "mock-public-key",
    VAPID_PRIVATE_KEY: "mock-private-key",
    VAPID_SUBJECT: "mailto:admin@setplay.gg",
    ADMIN_TOKEN: "mock-admin-token",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates VAPID details when all credentials are provided", () => {
    const result = hasValidVapidDetails(mockEnv);
    expect(result).toBe(true);
  });

  it("fails gracefully when VAPID credentials are missing", () => {
    const incompleteEnv = { ...mockEnv, VAPID_PUBLIC_KEY: "" };
    const result = hasValidVapidDetails(incompleteEnv);
    expect(result).toBe(false);
  });

  it("successfully sends notification and returns statusCode 201", async () => {
    vi.mocked(webpushSendNotification).mockResolvedValueOnce({
      statusCode: 201,
      headers: new Headers(),
      body: "",
    });

    const mockDb = {
      delete: vi.fn(),
    } as any;

    const sub = {
      id: "sub-123",
      endpoint: "https://fcm.googleapis.com/fcm/send/valid-sub",
      p256dh: "key-123",
      auth: "auth-123",
    };

    const payload = {
      eventId: "evo-2026",
      title: "EVO 2026 is Live!",
      body: "Watch live now",
    };

    const result = await sendPushNotification(mockDb, mockEnv, sub, payload);

    expect(result.success).toBe(true);
    expect(result.statusCode).toBe(201);
    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(webpushSendNotification).toHaveBeenCalledWith(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      expect.any(String),
      expect.objectContaining({
        vapidDetails: {
          subject: mockEnv.VAPID_SUBJECT,
          publicKey: mockEnv.VAPID_PUBLIC_KEY,
          privateKey: mockEnv.VAPID_PRIVATE_KEY,
        },
      }),
    );
  });

  it("Invariant #4: automatically prunes 410 Gone dead endpoints from D1", async () => {
    vi.mocked(webpushSendNotification).mockRejectedValueOnce({
      statusCode: 410,
      message: "Push subscription has unsubscribed or expired.",
    });

    const mockWhere = vi.fn().mockResolvedValueOnce(undefined);
    const mockDb = {
      delete: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    } as any;

    const sub = {
      id: "dead-sub-id",
      endpoint: "https://fcm.googleapis.com/fcm/send/expired-sub",
      p256dh: "key",
      auth: "auth",
    };

    const payload = {
      eventId: "evo-2026",
      title: "EVO 2026 is Live!",
      body: "Watch live now",
    };

    const result = await sendPushNotification(mockDb, mockEnv, sub, payload);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(410);
    expect(result.pruned).toBe(true);
    expect(mockDb.delete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("does not delete subscription on generic server errors (e.g. 500)", async () => {
    vi.mocked(webpushSendNotification).mockRejectedValueOnce({
      statusCode: 500,
      message: "Internal Server Error at Push Service",
    });

    const mockDb = {
      delete: vi.fn(),
    } as any;

    const sub = {
      id: "sub-id",
      endpoint: "https://fcm.googleapis.com/fcm/send/sub",
      p256dh: "key",
      auth: "auth",
    };

    const payload = {
      eventId: "evo-2026",
      title: "EVO 2026 is Live!",
      body: "Watch live now",
    };

    const result = await sendPushNotification(mockDb, mockEnv, sub, payload);

    expect(result.success).toBe(false);
    expect(result.statusCode).toBe(500);
    expect(result.pruned).toBeUndefined();
    expect(mockDb.delete).not.toHaveBeenCalled();
  });

  it("dispatches notifications to subscribers matching event interest", async () => {
    const mockSubscribers = [
      {
        id: "sub-1",
        endpoint: "https://fcm.googleapis.com/fcm/send/sub-1",
        p256dh: "key-1",
        auth: "auth-1",
      },
      {
        id: "sub-2",
        endpoint: "https://fcm.googleapis.com/fcm/send/sub-2",
        p256dh: "key-2",
        auth: "auth-2",
      },
    ];

    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockResolvedValue(mockSubscribers),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as any;

    // Sub 1 succeeds, Sub 2 returns 410 Gone
    vi.mocked(webpushSendNotification)
      .mockResolvedValueOnce({ statusCode: 201, headers: new Headers(), body: "" })
      .mockRejectedValueOnce({ statusCode: 410, message: "Subscription expired" });

    const stats = await dispatchPushToEventSubscribers(mockDb, mockEnv, "combo-breaker-2026", {
      eventId: "combo-breaker-2026",
      title: "Combo Breaker 2026 is Live!",
      body: "Finals have started",
    });

    expect(stats.sent).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.pruned).toBe(1);
  });
});
