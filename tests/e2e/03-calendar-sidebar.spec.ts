import { test, expect } from "@playwright/test";
import { mockLiveStreams } from "./fixtures";

test.describe("Calendar Sidebar Widget", () => {
  test.beforeEach(async ({ page, context }) => {
    await mockLiveStreams(page);
    await context.clearCookies();
  });

  test("renders calendar with current month, weekday headers, and today marker", async ({
    page,
  }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    const calendarAside = page.locator("aside");
    await expect(calendarAside).toBeVisible();

    // Verify calendar heading
    await expect(calendarAside.getByRole("heading", { name: /Calendar/ })).toBeVisible();

    // Verify weekday abbreviations (Sun, Mon, Tue, etc.)
    await expect(calendarAside.getByText("Sun")).toBeVisible();
    await expect(calendarAside.getByText("Sat")).toBeVisible();

    // Verify today's date indicator exists
    const todayBtn = calendarAside.locator('button[aria-current="date"]');
    await expect(todayBtn).toBeVisible();
  });

  test("navigates forward and backward between months", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    const calendarAside = page.locator("aside");
    const heading = calendarAside.getByRole("heading", { name: /Calendar/ });
    const initialText = await heading.textContent();

    // Click Next month
    const nextBtn = calendarAside.getByRole("button", { name: "Next month" });
    await nextBtn.click();
    const nextText = await heading.textContent();
    expect(nextText).not.toEqual(initialText);

    // Click Previous month
    const prevBtn = calendarAside.getByRole("button", { name: "Previous month" });
    await prevBtn.click();
    const prevText = await heading.textContent();
    expect(prevText).not.toEqual(nextText);
  });

  test("toggles day selection to filter events", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    const calendarAside = page.locator("aside");
    const daysGrid = calendarAside.getByRole("grid", { name: "Calendar days" });
    await expect(daysGrid).toBeVisible();

    // Find the 15th of the month button
    const dayBtn = daysGrid.getByRole("button", { name: /15, \d{4}/ });
    if (await dayBtn.isVisible()) {
      await dayBtn.click();
      await expect(dayBtn).toHaveAttribute("aria-pressed", "true");

      // Below grid should update heading to specific date
      await expect(calendarAside.getByText(/Events on/)).toBeVisible();

      // Click again to deselect
      await dayBtn.click();
      await expect(dayBtn).toHaveAttribute("aria-pressed", "false");
      await expect(calendarAside.getByText("Upcoming Events")).toBeVisible();
    }
  });

  test("navigates to /events from 'Show more' link", async ({ page }) => {
    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/");
    await liveStreamsResponse;

    const showMoreLink = page.locator("aside").getByRole("link", { name: "Show more" });
    await expect(showMoreLink).toBeVisible();

    await showMoreLink.click();
    await expect(page).toHaveURL(/\/events$/);
  });
});
