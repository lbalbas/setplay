import { describe, it, expect } from "vitest";
import { getTwitchThumbnail } from "../../utils/formatThumbnail";

describe("getTwitchThumbnail", () => {
  it("replaces {width} and {height} template tags with custom dimensions", () => {
    const template = "https://static-cdn.jtvnw.net/previews-ttv/live_user_evo-{width}x{height}.jpg";
    expect(getTwitchThumbnail(template, 640, 360)).toBe(
      "https://static-cdn.jtvnw.net/previews-ttv/live_user_evo-640x360.jpg",
    );
    expect(getTwitchThumbnail(template, 1280, 720)).toBe(
      "https://static-cdn.jtvnw.net/previews-ttv/live_user_evo-1280x720.jpg",
    );
  });

  it("handles null or undefined gracefully", () => {
    expect(getTwitchThumbnail(undefined)).toBe("");
    expect(getTwitchThumbnail(null)).toBe("");
  });
});
