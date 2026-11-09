import { describe, expect, it, vi } from "vitest";
import {
  StreamOverrideRecordSchema,
  StreamOverridesMapSchema,
  getOverridesFromKV,
  PRIORITY_WEIGHT,
  type StreamOverridesMap,
} from "../../server/overrides";
import type { MatchedStream } from "../../server/matching";

describe("Overrides Module", () => {
  describe("Zod Validation Schemas", () => {
    it("validates a valid StreamOverrideRecord", () => {
      const valid = {
        eventId: "evo-2026",
        eventName: "EVO 2026",
        priority: "headline",
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000,
        streamSessionStartedAt: "2026-11-09T12:00:00Z",
      };
      const parsed = StreamOverrideRecordSchema.parse(valid);
      expect(parsed.priority).toBe("headline");
      expect(parsed.eventId).toBe("evo-2026");
    });

    it("allows nullish eventId and expiresAt for casual/session overrides", () => {
      const casualOverride = {
        eventId: null,
        eventName: null,
        priority: "featured",
        createdAt: Date.now(),
        expiresAt: null,
      };
      const parsed = StreamOverrideRecordSchema.parse(casualOverride);
      expect(parsed.priority).toBe("featured");
      expect(parsed.eventId).toBeNull();
    });

    it("rejects invalid priority values", () => {
      const invalid = {
        priority: "super_headline",
        createdAt: Date.now(),
      };
      expect(() => StreamOverrideRecordSchema.parse(invalid)).toThrow();
    });

    it("validates a StreamOverridesMap dictionary", () => {
      const map: StreamOverridesMap = {
        "stream-1": {
          eventId: "ev-1",
          eventName: "Event 1",
          priority: "headline",
          createdAt: 1000,
          expiresAt: 2000,
        },
        "stream-2": {
          eventId: null,
          eventName: null,
          priority: "normal",
          createdAt: 1000,
          expiresAt: null,
        },
      };
      const parsed = StreamOverridesMapSchema.parse(map);
      expect(Object.keys(parsed)).toHaveLength(2);
      expect(parsed["stream-1"].priority).toBe("headline");
    });
  });

  describe("getOverridesFromKV", () => {
    it("returns parsed map when valid JSON exists in KV", async () => {
      const mockKV = {
        get: vi.fn().mockResolvedValue({
          "123": {
            eventId: "evo",
            eventName: "EVO",
            priority: "headline",
            createdAt: 1000,
            expiresAt: null,
          },
        }),
      } as unknown as KVNamespace;

      const result = await getOverridesFromKV(mockKV);
      expect(result["123"]).toBeDefined();
      expect(result["123"].priority).toBe("headline");
    });

    it("returns empty object when KV returns null", async () => {
      const mockKV = {
        get: vi.fn().mockResolvedValue(null),
      } as unknown as KVNamespace;

      const result = await getOverridesFromKV(mockKV);
      expect(result).toEqual({});
    });

    it("returns empty object safely when KV has corrupt schema data", async () => {
      const mockKV = {
        get: vi.fn().mockResolvedValue({
          "bad-stream": {
            priority: "INVALID_PRIORITY",
          },
        }),
      } as unknown as KVNamespace;

      const result = await getOverridesFromKV(mockKV);
      expect(result).toEqual({});
    });
  });

  describe("Priority Weight Sorting", () => {
    it("sorts headline before featured, and featured before normal", () => {
      const streams: Partial<MatchedStream>[] = [
        { id: "1", priority: "normal", viewerCount: 5000 },
        { id: "2", priority: "headline", viewerCount: 100 },
        { id: "3", priority: "featured", viewerCount: 1000 },
      ];

      streams.sort((a, b) => {
        const weightDiff =
          (PRIORITY_WEIGHT[b.priority ?? "normal"] ?? 1) -
          (PRIORITY_WEIGHT[a.priority ?? "normal"] ?? 1);
        if (weightDiff !== 0) return weightDiff;
        return (b.viewerCount ?? 0) - (a.viewerCount ?? 0);
      });

      expect(streams[0].id).toBe("2"); // headline
      expect(streams[1].id).toBe("3"); // featured
      expect(streams[2].id).toBe("1"); // normal
    });

    it("breaks priority ties using viewerCount descending", () => {
      const streams: Partial<MatchedStream>[] = [
        { id: "1", priority: "featured", viewerCount: 500 },
        { id: "2", priority: "featured", viewerCount: 2500 },
        { id: "3", priority: "featured", viewerCount: 1200 },
      ];

      streams.sort((a, b) => {
        const weightDiff =
          (PRIORITY_WEIGHT[b.priority ?? "normal"] ?? 1) -
          (PRIORITY_WEIGHT[a.priority ?? "normal"] ?? 1);
        if (weightDiff !== 0) return weightDiff;
        return (b.viewerCount ?? 0) - (a.viewerCount ?? 0);
      });

      expect(streams[0].id).toBe("2");
      expect(streams[1].id).toBe("3");
      expect(streams[2].id).toBe("1");
    });
  });
});
