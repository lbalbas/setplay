import { test, expect } from "@playwright/test";
import { mockLiveStreams } from "./fixtures";

const VALID_ADMIN_TOKEN = "my_super_secret_local_token_123";

test.describe("Admin Portal & Session Management", () => {
  test.beforeEach(async ({ page, context }) => {
    await mockLiveStreams(page);
    await context.clearCookies();
  });

  test("displays AdminGate lock screen when unauthenticated", async ({ page }) => {
    await page.goto("/admin");

    // Verify Admin Gate lock card
    await expect(page.getByRole("heading", { name: "Admin Access Required" })).toBeVisible();
    await expect(page.getByPlaceholder("••••••••••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: "Authorize Session" })).toBeVisible();

    // Verify dashboard content is NOT visible
    await expect(page.getByText("Stream Management Dashboard")).not.toBeVisible();
  });

  test("shows error message when entering an invalid token", async ({ page }) => {
    await page.goto("/admin");
    const tokenInput = page.getByPlaceholder("••••••••••••••••");
    const submitBtn = page.getByRole("button", { name: "Authorize Session" });

    await expect(async () => {
      await tokenInput.fill("wrong_invalid_token_xyz");
      await submitBtn.click();
      await expect(
        page.getByText(/Invalid admin token|Invalid administrator credentials/),
      ).toBeVisible();
    }).toPass();

    // Still on gate
    await expect(page.getByRole("heading", { name: "Admin Access Required" })).toBeVisible();
  });

  test("authenticates successfully with valid token and loads dashboard", async ({ page }) => {
    await page.goto("/admin");
    const tokenInput = page.getByPlaceholder("••••••••••••••••");
    const submitBtn = page.getByRole("button", { name: "Authorize Session" });

    await expect(async () => {
      await tokenInput.fill(VALID_ADMIN_TOKEN);
      await submitBtn.click();
      await expect(
        page.getByRole("heading", { name: "Stream Management Dashboard" }),
      ).toBeVisible();
    }).toPass();

    // Verify top stats cards
    await expect(page.locator("span", { hasText: "Active Streams" })).toBeVisible();
    await expect(page.getByText("Linked to Events")).toBeVisible();
    await expect(page.getByText("Headline Priority")).toBeVisible();
    await expect(page.getByText("Last Sync")).toBeVisible();
  });

  test("switches between Active Streams and Cron Logs tabs", async ({ page, context }) => {
    // Pre-authenticate via cookie
    await context.addCookies([
      {
        name: "admin_token",
        value: VALID_ADMIN_TOKEN,
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Stream Management Dashboard" })).toBeVisible();
    await expect(page.getByRole("table")).toBeVisible();

    // Switch to Cron Logs tab
    const cronTab = page.getByRole("button", { name: "Cron Logs" });
    await expect(async () => {
      await cronTab.click();
      await expect(page.getByText("Cron Job Status Log")).toBeVisible();
    }).toPass();

    // Switch back to Active Streams tab
    const streamsTab = page.getByRole("button", { name: "Active Streams" });
    await expect(async () => {
      await streamsTab.click();
      await expect(page.getByRole("table")).toBeVisible();
    }).toPass();
  });

  test("opens Link Stream to Event sidebar when editing a stream", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "admin_token",
        value: VALID_ADMIN_TOKEN,
        url: "http://localhost:3000",
      },
    ]);

    const liveStreamsResponse = page.waitForResponse("**/api/live-streams");
    await page.goto("/admin");
    await liveStreamsResponse;

    await expect(page.getByRole("table")).toBeVisible();

    // Find the first Edit button in the streams table
    const firstEditBtn = page
      .locator("table tbody tr")
      .first()
      .getByRole("button", { name: "Edit" });
    await expect(firstEditBtn).toBeVisible();

    await expect(async () => {
      await firstEditBtn.click();
      await expect(page.getByText("Editing:", { exact: false })).toBeVisible();
    }).toPass();

    // Sidebar should now display form controls
    await expect(page.getByLabel("Event ID")).toBeVisible();
    await expect(page.getByText("Priority Level")).toBeVisible();
    await expect(page.getByText("Override Duration")).toBeVisible();
    await expect(page.getByRole("button", { name: "Apply Override" })).toBeVisible();

    // Cancel edit
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByText("Select a stream from the table to link it to a tournament event."),
    ).toBeVisible();
  });

  test("logs out and returns to AdminGate when clicking Lock", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "admin_token",
        value: VALID_ADMIN_TOKEN,
        url: "http://localhost:3000",
      },
    ]);

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Stream Management Dashboard" })).toBeVisible();

    // Click Lock (logout) button
    const lockBtn = page.getByRole("button", { name: "Lock" });
    await expect(lockBtn).toBeVisible();

    await expect(async () => {
      await lockBtn.click();
      await expect(page.getByRole("heading", { name: "Admin Access Required" })).toBeVisible();
    }).toPass();

    await expect(page.getByPlaceholder("••••••••••••••••")).toBeVisible();
  });
});
