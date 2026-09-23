import type { Env } from "./db";

/**
 * Resolves Cloudflare Worker environment bindings (DB, KV, Secrets).
 * Supports:
 * - Direct injection via TanStack Start request context
 * - Standard `cloudflare:workers` module import in workerd / Vite SSR
 * - Global fallback
 */
export async function getWorkerEnv(context?: any): Promise<Env | undefined> {
  if (context?.env?.DB || context?.env?.KV) {
    return context.env as Env;
  }

  try {
    const cf = await import("cloudflare:workers");
    if (cf?.env) {
      return cf.env as unknown as Env;
    }
  } catch {
    // Non-workers runtime
  }

  if ((globalThis as any).env?.DB || (globalThis as any).env?.KV) {
    return (globalThis as any).env as Env;
  }

  return undefined;
}
