import { createServerFn } from "@tanstack/react-start";
import { getRequest, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { getWorkerEnv } from "./env";

export const checkAdminAuth = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  // 1. Get environment variables via Cloudflare helper
  const env = await getWorkerEnv(context);
  const expectedSecret = env?.ADMIN_TOKEN;

  if (!expectedSecret) {
    console.warn("[checkAdminAuth] ADMIN_TOKEN environment variable is not defined.");
    return { authenticated: false };
  }

  // 2. Get the incoming standard Request object directly from TanStack Start
  const request = getRequest();
  if (!request) {
    return { authenticated: false };
  }

  // 3. Extract authorization header or cookies directly from request headers
  const authHeader = request.headers.get("authorization");
  const tokenFromHeader = authHeader?.replace(/^Bearer\s+/i, "");

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, ...v] = c.split("=");
      return [key.trim(), v.join("=")];
    }),
  );
  const tokenFromCookie = cookies["admin_token"];

  const clientToken = tokenFromHeader || tokenFromCookie;

  // 4. Compare tokens
  return {
    authenticated: Boolean(clientToken && clientToken === expectedSecret),
  };
});

const loginSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const loginAdmin = createServerFn({ method: "POST" })
  .validator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data, context }) => {
    const env = await getWorkerEnv(context);
    const expectedSecret = env?.ADMIN_TOKEN;

    if (!expectedSecret) {
      console.warn("[loginAdmin] ADMIN_TOKEN environment variable is not defined.");
      return { success: false, error: "Server admin token not configured" };
    }

    if (data.token !== expectedSecret) {
      return { success: false, error: "Invalid admin token" };
    }

    // Set HttpOnly cookie valid for 30 days
    setCookie("admin_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return { success: true };
  });

export const logoutAdmin = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie("admin_token", {
    path: "/",
  });
  return { success: true };
});
