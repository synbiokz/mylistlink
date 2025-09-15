import { randomUUID } from "crypto";

export function getRequestId(req: Request): string {
  // Headers may be Node/edge compatible; use generic accessor
  const h = (req.headers as any)?.get?.("x-request-id");
  return h || randomUUID();
}

export function withRequestId(resp: Response, requestId: string) {
  resp.headers.set("X-Request-ID", requestId);
  return resp;
}

export function json(data: any, init?: ResponseInit) {
  const body = JSON.stringify(data);
  return new Response(body, { ...(init || {}), headers: { "content-type": "application/json", ...(init?.headers || {}) } });
}

