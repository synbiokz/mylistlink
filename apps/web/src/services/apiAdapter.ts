import { z } from "zod";
import {
  CreateDraftResponseSchema,
  LatestDraftResponseSchema,
  ResolveItemResponseSchema,
  SearchItemSchema,
  SearchResponseSchema,
  SessionSchema,
  SlotsResponseSchema,
  type Draft,
  type SearchItem,
  type Slot,
} from "@/types/contracts";
import type { ApiError } from "@/types/errors";
import type { AuthService, ItemsService, ListsService, SearchService, Services, UsersService } from "./types";
import type { GroupedSearchResponse } from "@/types/search-grouped";

async function parseJson<T extends z.ZodTypeAny>(res: Response, schema: T) {
  const data = await res.json().catch(() => ({}));
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw { code: "UNKNOWN", message: "Invalid response", issues: parsed.error } as any;
  }
  return parsed.data as z.infer<T>;
}

function parseError(res: Response, body: any): ApiError {
  const code = body?.error?.code || (res.status === 401 ? "AUTH_UNAUTHORIZED" : res.status === 403 ? "AUTH_FORBIDDEN" : res.status === 404 ? "NOT_FOUND" : res.status === 409 ? "CONFLICT_POSITION" : res.status === 429 ? "RATE_LIMIT" : "UNKNOWN");
  const message = body?.error?.message;
  return { code, message };
}

const lists: ListsService = {
  async createDraft(input) {
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: input.title, description: input.description ?? null }),
    });
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data = await parseJson(res, CreateDraftResponseSchema);
    return { id: data.list.id, slug: data.list.slug };
  },
  async getLatestDraft(): Promise<Draft | null> {
    const res = await fetch("/api/lists/drafts/latest");
    if (!res.ok) {
      if (res.status === 401) return null;
      throw parseError(res, await res.json().catch(() => null));
    }
    const data = await parseJson(res, LatestDraftResponseSchema);
    return data.draft ?? null;
  },
  async setSlot(listId, itemId, position, opts) {
    const res = await fetch(`/api/lists/${listId}/items/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, position, clientRequestId: opts?.clientRequestId }),
    });
    const body = await res.json().catch(() => ({}));
    const slots = SlotsResponseSchema.safeParse(body).success ? (body as { slots: Slot[] }).slots : [];
    if (!res.ok) return { slots, error: parseError(res, body) };
    return { slots };
  },
  async removeSlot(listId, position) {
    const res = await fetch(`/api/lists/${listId}/items?position=${position}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { slots: [], error: parseError(res, body) };
    const data = SlotsResponseSchema.safeParse(body);
    return { slots: data.success ? data.data.slots : [] };
  },
  async publish(listId) {
    const res = await fetch(`/api/lists/${listId}/publish`, { method: "POST" });
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
  },
};

const items: ItemsService = {
  async resolve(item: SearchItem) {
    const res = await fetch("/api/items/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data = await parseJson(res, ResolveItemResponseSchema);
    return { itemId: data.itemId, slug: data.slug };
  },
};

const search: SearchService = {
  async search(q: string, opts) {
    const params = new URLSearchParams({ q });
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit) params.set("limit", String(opts.limit));
    const res = await fetch(`/api/sources/search?${params.toString()}`);
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data = await parseJson(res, SearchResponseSchema);
    // Validate each item, tolerate partials by filtering invalid
    return (data.items || []).map((it: unknown) => SearchItemSchema.safeParse(it)).filter((r) => r.success).map((r) => r.data);
  },
  async searchGrouped(q: string, opts) {
    const params = new URLSearchParams({ q });
    if (opts?.type) params.set("type", opts.type);
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.expand) params.set("expand", opts.expand ? "1" : "0");
    const res = await fetch(`/api/search/grouped?${params.toString()}`);
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data: GroupedSearchResponse = await res.json();
    return data.items;
  },
};

const auth: AuthService = {
  async getSession() {
    const res = await fetch("/api/auth/session");
    if (res.status === 204) return null; // next-auth may return empty
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return null;
    const parsed = SessionSchema.safeParse(data);
    if (!parsed.success) return null;
    return parsed.data;
  },
  async signIn(input) {
    const { provider, email, name, callbackUrl, redirect } = input;
    // Use dynamic import so this module remains isomorphic; only resolves on client.
    const mod = await import("next-auth/react");
    const res: any = await mod.signIn(provider, {
      email,
      name,
      redirect: redirect !== false, // default true
      callbackUrl: callbackUrl ?? "/create",
    });
    // NextAuth returns { ok?: boolean, error?: string | null, url?: string }
    const ok = !!(res?.ok || res?.url);
    return { ok, url: res?.url ?? null, error: res?.error ?? null };
  },
  async signOut(input) {
    const mod = await import("next-auth/react");
    await mod.signOut({ redirect: input?.redirect !== false, callbackUrl: input?.callbackUrl ?? "/" });
  },
};

const users: UsersService = {
  async getMe() {
    const res = await fetch("/api/users/me");
    if (res.status === 401) return null;
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.user) return null;
    const u = body.user as any;
    return { id: Number(u.id), handle: String(u.handle), email: u.email ?? null, name: u.name ?? null, avatarUrl: u.avatarUrl ?? null };
  },
};

export const apiAdapter: Services = { lists, items, search, auth, users };
