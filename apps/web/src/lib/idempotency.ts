// Simple in-memory idempotency store for M1 (dev/runtime). Replaceable with DB/Redis later.

type Entry = { storedAt: number; body: any };

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const store = new Map<string, Entry>();

function keyFor(listId: number, idemKey: string) {
  return `${listId}:${idemKey}`;
}

export function idemGet(listId: number, idemKey?: string): any | null {
  if (!idemKey) return null;
  const k = keyFor(listId, idemKey);
  const e = store.get(k);
  if (!e) return null;
  if (Date.now() - e.storedAt > TTL_MS) {
    store.delete(k);
    return null;
  }
  return e.body;
}

export function idemSet(listId: number, idemKey: string | undefined, body: any) {
  if (!idemKey) return;
  const k = keyFor(listId, idemKey);
  store.set(k, { storedAt: Date.now(), body });
}

