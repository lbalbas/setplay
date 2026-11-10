import { test, expect } from "@playwright/test";
import { mockLiveStreams } from "./fixtures";

test.describe("Watch View & Live Stream Player Experience", () => {
  test.beforeEach(async ({ page, context }) => {
    await mockLiveStreams(page);
    await context.clearCookies();
    // Grant clipboard permissions for share testing
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });

  test("redirects from /watch to the headline active stream", async ({ page }) => {
    await page.goto("/watch");
    await expect(page).toHaveURL(/\/watch\/.+/);
  });

  test("renders stream player, breadcrumbs, channel metadata, and match card", async ({ page }) => {
    await page.goto("/watch/stream-evo-sf6");

    // WatchNav elements
    const backBtn = page.getByRole("button", { name: "Back to Streams" });
    await expect(backBtn).toBeVisible();

    // Stream Title & Channel info
    await expect(
      page.getByRole("heading", { name: "EVO 2026 — Street Fighter 6 Grand Finals" }),
    ).toBeVisible();
    await expect(page.getByText("EVO_Official")).toBeVisible();

    // Video iframe embed
    const iframe = page.locator("iframe").first();
    await expect(iframe).toBeVisible();
    await expect(iframe).toHaveAttribute("src", /player\.twitch\.tv/);

    // Match Metadata Card
    await expect(page.getByText("Event", { exact: true })).toBeVisible();
    await expect(page.getByText("Grand Finals", { exact: true })).toBeVisible();
    await expect(page.getByText("View on Start.gg")).toBeVisible();
  });

  test("toggles theater mode via button and keyboard shortcut 't'", async ({ page }) => {
    await page.goto("/watch/stream-evo-sf6");

    const theaterBtn = page.getByRole("button", { name: "Theater Mode" });
    await expect(theaterBtn).toBeVisible();

    // Click button to enter theater mode
    await theaterBtn.click();
    await expect(page.locator("body")).toHaveClass(/theater-mode/);
    await expect(page.getByRole("button", { name: "Exit Theater" })).toBeVisible();

    // Press 't' key to exit theater mode
    await page.keyboard.press("t");
    await expect(page.locator("body")).not.toHaveClass(/theater-mode/);
    await expect(page.getByRole("button", { name: "Theater Mode" })).toBeVisible();

    // Press 't' key to enter theater mode again
    await page.keyboard.press("t");
    await expect(page.locator("body")).toHaveClass(/theater-mode/);
  });

  test("toggles live chat sidebar visibility", async ({ page }) => {
    await page.goto("/watch/stream-evo-sf6");

    // Chat sidebar is visible by default
    const chatSidebar = page.locator("aside");
    await expect(chatSidebar).toBeVisible();

    // Click Chat button to toggle off
    const chatBtn = page.getByRole("button", { name: "Chat" });
    await chatBtn.click();

    // Chat sidebar should now be hidden
    await expect(chatSidebar).not.toBeVisible();

    // Click Chat button again to re-open
    await chatBtn.click();
    await expect(chatSidebar).toBeVisible();
  });

  test("toggles Save/Bookmark button state", async ({ page }) => {
    await page.goto("/watch/stream-evo-sf6");

    const saveBtn = page.getByRole("button", { name: "Save" });
    await expect(saveBtn).toBeVisible();

    await saveBtn.click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();

    await page.getByRole("button", { name: "Saved" }).click();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });

  test("copies stream URL to clipboard when clicking Share", async ({ page }) => {
    await page.goto("/watch/stream-evo-sf6");

    const shareBtn = page.getByRole("button", { name: "Share" });
    await expect(shareBtn).toBeVisible();

    await shareBtn.click();
    await expect(page.getByText("Copied")).toBeVisible();
  });

  test("renders offline fallback for unknown or offline stream with return CTA", async ({
    page,
  }) => {
    await page.goto("/watch/unknown-stream-channel-xyz-999");

    // Offline card
    await expect(page.getByRole("heading", { name: "Stream Offline" })).toBeVisible();
    await expect(
      page.locator("span.font-mono", { hasText: "unknown-stream-channel-xyz-999" }),
    ).toBeVisible();

    // Return to Live Streams CTA button
    const returnBtn = page.getByRole("button", { name: "Return to Live Streams" });
    await expect(returnBtn).toBeVisible();

    await returnBtn.click();
    await expect(page).toHaveURL(/\/(#.*)?$/);
  });
});
