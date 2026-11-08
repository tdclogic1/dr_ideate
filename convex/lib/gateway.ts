// Minimal 2030 gateway client (fetch only — usable from both Convex runtimes).
// Base URL + key are passed in so this stays pure of process.env and testable;
// callers read them from Convex env (never app code — PLATFORM-CONNECTION-SPEC).
export type GatewayResult = { ok: true; data: unknown } | { ok: false; error: string };

export async function gatewayRequest(
  base: string,
  key: string,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  headers?: Record<string, string>,   // e.g. { authorization: "Bearer ut_…" } for per-person calls
): Promise<GatewayResult> {
  let res: Response;
  try {
    const init: RequestInit = { method, headers: { "content-type": "application/json", "x-api-key": key, ...(headers ?? {}) } };
    if (method === "POST") init.body = JSON.stringify(body ?? {});
    res = await fetch(`${base}${path}`, init);
  } catch (e) {
    return { ok: false, error: `gateway unreachable: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!res.ok) return { ok: false, error: `gateway ${res.status}: ${await res.text()}` };
  return { ok: true, data: await res.json() };
}
