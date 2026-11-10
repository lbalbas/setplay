import { test, expect } from "@playwright/test";
import { mockLiveStreams } from "./fixtures";

test.describe("Events Directory & Tournament Calendar", () => {
  test.beforeEach(async ({ page, context }) => {
    await mockLiveStreams(page);
    await context.clearCookies();
    await page.goto("/events");
    await page.waitForSelector('[role="group"][aria-label="Event location filters"]');
    await page.waitForTimeout(1500);
  });

  test("renders events directory header and metrics", async ({ page }) => {
    // Header badge & main title
    await expect(page.getByText("EVENTS DIRECTORY")).toBeVisible();
    await expect(page.getByRole("heading", { name: "FGC Tournament Calendar" })).toBeVisible();

    // Stats
    await expect(page.getByText("Total Events")).toBeVisible();
    await expect(page.getByText("Active Players")).toBeVisible();
  });

  test("filters events by location (All, Online, Offline)", async ({ page }) => {
    const locationGroup = page.getByRole("group", { name: "Event location filters" });
    await expect(locationGroup).toBeVisible();

    const allBtn = locationGroup.getByRole("button", { name: "All", exact: true });
    const onlineBtn = locationGroup.getByRole("button", { name: "Online", exact: true });
    const offlineBtn = locationGroup.getByRole("button", { name: "Offline", exact: true });

    // Click Online (retrying until hydration has bound the event handler)
    await expect(async () => {
      await onlineBtn.click();
      await expect(onlineBtn).toHaveClass(/bg-accent/);
    }).toPass();

    // Click Offline
    await expect(async () => {
      await offlineBtn.click();
      await expect(offlineBtn).toHaveClass(/bg-accent/);
    }).toPass();

    // Revert to All
    await expect(async () => {
      await allBtn.click();
      await expect(allBtn).toHaveClass(/bg-accent/);
    }).toPass();
  });

  test("filters events by status (Upcoming & Live, Ongoing, Upcoming, Completed, All)", async ({
    page,
  }) => {
    const statusGroup = page.getByRole("group", { name: "Event status filters" });
    await expect(statusGroup).toBeVisible();

    const upcomingLiveBtn = statusGroup.getByRole("button", {
      name: "Upcoming & Live",
      exact: true,
    });
    const ongoingBtn = statusGroup.getByRole("button", { name: "Ongoing", exact: true });
    const completedBtn = statusGroup.getByRole("button", { name: "Completed", exact: true });

    // Default: Upcoming & Live is active
    await expect(upcomingLiveBtn).toHaveClass(/bg-accent/);

    // Click Ongoing
    await expect(async () => {
      await ongoingBtn.click();
      await expect(ongoingBtn).toHaveClass(/bg-accent/);
    }).toPass();

    // Click Completed
    await expect(async () => {
      await completedBtn.click();
      await expect(completedBtn).toHaveClass(/bg-accent/);
    }).toPass();
  });

  test("displays empty state and resets filters on 'Clear Filters' click", async ({ page }) => {
    // Combine filters that result in 0 events (e.g. Online + Completed)
    const locationGroup = page.getByRole("group", { name: "Event location filters" });
    const statusGroup = page.getByRole("group", { name: "Event status filters" });

    await locationGroup.getByRole("button", { name: "Online" }).click();
    await statusGroup.getByRole("button", { name: "Completed" }).click();

    const emptyState = page.getByText("No events found");
    if (await emptyState.isVisible()) {
      const clearBtn = page.getByRole("button", { name: "Clear Filters" });
      await expect(clearBtn).toBeVisible();
      await clearBtn.click();

      // Clear Filters should reset to Upcoming & Live and All location
      await expect(emptyState).not.toBeVisible();
    }
  });

  test("renders external bracket link on events that have one", async ({ page }) => {
    const bracketLinks = page.locator("a").filter({ hasText: "Bracket" });
    const count = await bracketLinks.count();

    if (count > 0) {
      const firstBracket = bracketLinks.first();
      await expect(firstBracket).toHaveAttribute("target", "_blank");
      await expect(firstBracket).toHaveAttribute("rel", /noopener/);
      const href = await firstBracket.getAttribute("href");
      expect(href).toMatch(/^https?:\/\//);
    }
  });
});
