import { test, expect } from "@playwright/test";
import { mockLiveStreams } from "./fixtures";

test.describe("Dashboard Streams & Game Filtering", () => {
  test.beforeEach(async ({ page, context }) => {
    await mockLiveStreams(page);
    await context.clearCookies();
  });

  test("renders the headline featured hero with metadata and watch CTA", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    // Verify headline badge and hero section
    const headlineBadge = page.getByText("Headline Event");
    await expect(headlineBadge).toBeVisible();

    // Verify stats in headline
    await expect(page.getByText("Current Viewers")).toBeVisible();
    await expect(page.getByText("Duration")).toBeVisible();

    // Verify Watch Now CTA in hero
    const heroWatchBtn = page.locator("section").first().getByRole("button", { name: "Watch Now" });
    await expect(heroWatchBtn).toBeVisible();

    // Click Watch Now and verify navigation to a /watch route
    await heroWatchBtn.click();
    await expect(page).toHaveURL(/\/watch\/.+/);
  });

  test("filters streams by game pills and persists selection in localStorage", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    // Clear any previous game filter
    await page.evaluate(() => localStorage.removeItem("setplay_game_filter"));

    const gameFilterGroup = page.getByRole("group", { name: "Game filters" });
    await expect(gameFilterGroup).toBeVisible();

    // Click SF6 pill
    const sf6Btn = gameFilterGroup.getByRole("button", { name: "SF6", exact: true });
    await expect(sf6Btn).toBeVisible();
    await sf6Btn.click();
    await expect(sf6Btn).toHaveAttribute("aria-pressed", "true");

    // Check localStorage persistence with setplay_game_filter key
    const savedGame = await page.evaluate(() => localStorage.getItem("setplay_game_filter"));
    expect(savedGame).toBeTruthy();

    // Reload page and wait for live streams
    const reloadResponse = page.waitForResponse("**/api/live-streams");
    await page.reload();
    await reloadResponse;

    const sf6BtnAfterReload = page
      .getByRole("group", { name: "Game filters" })
      .getByRole("button", { name: "SF6", exact: true });
    await expect(sf6BtnAfterReload).toHaveAttribute("aria-pressed", "true");

    // Click "All" again to reset
    const allBtnAfterReload = page
      .getByRole("group", { name: "Game filters" })
      .getByRole("button", { name: "All", exact: true });
    await allBtnAfterReload.click();
    await expect(allBtnAfterReload).toHaveAttribute("aria-pressed", "true");
  });

  test("opens + More overflow dropdown and selects an overflow game", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    const gameFilterGroup = page.getByRole("group", { name: "Game filters" });
    const moreBtn = gameFilterGroup.locator("button").filter({ hasText: /\+ More/ });

    if (await moreBtn.isVisible()) {
      await moreBtn.click();

      // Dropdown menu should be visible
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();

      // Click the first item in the overflow dropdown
      const firstMenuItem = menu.getByRole("menuitem").first();
      await expect(firstMenuItem).toBeVisible();
      await firstMenuItem.click();

      // Menu should close
      await expect(menu).not.toBeVisible();
    }
  });

  test("filters streams by stream type (All, Tournament, Casual)", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    const streamTypeGroup = page.getByRole("group", { name: "Stream type filters" });
    await expect(streamTypeGroup).toBeVisible();

    // Filter by Tournament
    const tournamentPill = streamTypeGroup.getByRole("button", {
      name: "Tournament",
      exact: true,
    });
    await tournamentPill.click();
    await expect(tournamentPill).toHaveAttribute("aria-pressed", "true");

    // Pinned tournaments section separator should be visible
    const pinnedHeading = page.getByText("PINNED TOURNAMENTS");
    await expect(pinnedHeading).toBeVisible();

    // Filter by Casual
    const casualPill = streamTypeGroup.getByRole("button", { name: "Casual", exact: true });
    await casualPill.click();
    await expect(casualPill).toHaveAttribute("aria-pressed", "true");

    // When viewing Casual only, PINNED TOURNAMENTS should be hidden
    await expect(page.getByText("PINNED TOURNAMENTS")).not.toBeVisible();
  });

  test("navigates to stream watch page from a stream card", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    // Locate the first stream card's watch link and scroll into view
    const firstCardLink = page.locator("article").first().getByRole("link", { name: "WATCH NOW" });
    await expect(firstCardLink).toBeVisible();

    await firstCardLink.scrollIntoViewIfNeeded();
    await firstCardLink.click();
    await expect(page).toHaveURL(/\/watch\/.+/);
  });
});
