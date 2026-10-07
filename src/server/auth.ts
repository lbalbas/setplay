import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getWorkerEnv } from "./env";

export const checkAdminAuth = createServerFn({ method: "GET" }).handler(async ({ context }) => {
  // 1. Get environment variables via your existing Cloudflare helper
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
