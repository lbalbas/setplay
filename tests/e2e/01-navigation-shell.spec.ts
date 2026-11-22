import { test, expect } from "@playwright/test";
import { getValidAdminToken } from "./fixtures";

test.describe("Global Navigation Shell & Layout", () => {
  test("loads the root page with correct title, dark mode, and header", async ({ page }) => {
    await page.goto("/");

    // Verify document title
    await expect(page).toHaveTitle(/SetPlay/);

    // Verify dark mode class on root html element
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Verify header brand logo
    const logo = page.locator("header").getByRole("link", { name: "SetPlay" });
    await expect(logo).toBeVisible();
    await expect(logo).toHaveAttribute("href", "/");

    // Search input is temporarily disabled/commented out until global search is implemented
    const searchInput = page.getByPlaceholder("Search streams, events, players...");
    await expect(searchInput).not.toBeVisible();

    // Verify public nav links
    const streamsLink = page.locator("header nav").getByRole("link", { name: "Streams" });
    const eventsLink = page.locator("header nav").getByRole("link", { name: "Events" });
    await expect(streamsLink).toBeVisible();
    await expect(eventsLink).toBeVisible();

    // Admin link should NOT be visible to unauthenticated visitors
    const adminLink = page.locator("header nav").getByRole("link", { name: "Admin" });
    await expect(adminLink).not.toBeVisible();
  });

  test("shows Admin nav link when authenticated with admin cookie", async ({ page, context }) => {
    // Set the admin_token cookie
    await context.addCookies([
      {
        name: "admin_token",
        value: encodeURIComponent(getValidAdminToken()),
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/");

    // Admin link should now be visible
    const adminLink = page.locator("header nav").getByRole("link", { name: "Admin" });
    await expect(adminLink).toBeVisible();

    // Clicking it navigates to /admin
    await adminLink.click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText("Admin Portal")).toBeVisible();
  });

  test("navigates between Streams and Events routes cleanly", async ({ page }) => {
    await page.goto("/");

    // Click Events in nav
    const eventsLink = page.locator("header nav").getByRole("link", { name: "Events" });
    await eventsLink.click();
    await expect(page).toHaveURL(/\/events$/);

    // Verify Events header title
    await expect(page.getByRole("heading", { name: "FGC Tournament Calendar" })).toBeVisible();

    // Click Brand logo to return home
    const logo = page.locator("header").getByRole("link", { name: "SetPlay" });
    await logo.click();
    await expect(page).toHaveURL(/\/(#.*)?$/);

    // Verify home elements present
    await expect(page.getByRole("heading", { name: "Live Streams" })).toBeVisible();
  });

  test("displays footer copyright notice", async ({ page }) => {
    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
    await expect(footer).toContainText(/Luis Balbas\. All rights reserved\./);
  });
});
