import { describe, expect, it } from "vitest";
import { z } from "zod";

const loginSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

function parseClientToken(headers: Headers): string | undefined {
  const authHeader = headers.get("authorization");
  const tokenFromHeader = authHeader?.replace(/^Bearer\s+/i, "");

  const cookieHeader = headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...v] = c.split("=");
      return [key.trim(), v.join("=")];
    }),
  );
  const tokenFromCookie = cookies["admin_token"];

  return tokenFromHeader || tokenFromCookie;
}

describe("Admin Authentication Primitives", () => {
  describe("loginSchema", () => {
    it("accepts a non-empty string token", () => {
      const res = loginSchema.safeParse({ token: "my-secret-admin-token" });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.token).toBe("my-secret-admin-token");
      }
    });

    it("rejects empty token", () => {
      const res = loginSchema.safeParse({ token: "" });
      expect(res.success).toBe(false);
    });

    it("rejects missing token field", () => {
      const res = loginSchema.safeParse({});
      expect(res.success).toBe(false);
    });
  });

  describe("Token extraction from headers & cookies", () => {
    it("extracts token from Authorization: Bearer header", () => {
      const headers = new Headers({
        authorization: "Bearer secret_token_123",
      });
      const token = parseClientToken(headers);
      expect(token).toBe("secret_token_123");
    });

    it("extracts token from admin_token cookie", () => {
      const headers = new Headers({
        cookie: "theme=dark; admin_token=cookie_secret_456; other=val",
      });
      const token = parseClientToken(headers);
      expect(token).toBe("cookie_secret_456");
    });

    it("prefers Bearer header over cookie when both are present", () => {
      const headers = new Headers({
        authorization: "Bearer header_token",
        cookie: "admin_token=cookie_token",
      });
      const token = parseClientToken(headers);
      expect(token).toBe("header_token");
    });

    it("returns undefined when neither header nor cookie is present", () => {
      const headers = new Headers({
        "content-type": "application/json",
      });
      const token = parseClientToken(headers);
      expect(token).toBeUndefined();
    });
  });
});
