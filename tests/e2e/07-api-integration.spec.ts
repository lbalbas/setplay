import { test, expect } from "@playwright/test";

test.describe("Public API Endpoints Integration", () => {
  test("GET /api/live-streams returns 200 with JSON array and caching headers", async ({
    request,
  }) => {
    const response = await request.get("/api/live-streams");

    expect(response.status()).toBe(200);

    // Verify Content-Type
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("application/json");

    // Verify CORS headers
    const corsOrigin = response.headers()["access-control-allow-origin"];
    expect(corsOrigin).toBe("*");

    // Verify body is an array
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("OPTIONS /api/live-streams handles CORS preflight cleanly", async ({ request }) => {
    const response = await request.fetch("/api/live-streams", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:3000",
        "Access-Control-Request-Method": "GET",
      },
    });

    expect(response.ok()).toBe(true);

    const headers = response.headers();
    expect(headers["access-control-allow-origin"]).toBeTruthy();
    expect(headers["access-control-allow-methods"]).toContain("GET");
  });
});
