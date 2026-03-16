import { randomUUID } from "crypto";

export function getRequestId(req: Request): string {
  return req.headers.get("x-request-id") || randomUUID();
}

export function withRequestId(resp: Response, requestId: string) {
  resp.headers.set("X-Request-ID", requestId);
  return resp;
}

export function json(data: unknown, init?: ResponseInit) {
  const body = JSON.stringify(data);
  return new Response(body, { ...(init || {}), headers: { "content-type": "application/json", ...(init?.headers || {}) } });
}
