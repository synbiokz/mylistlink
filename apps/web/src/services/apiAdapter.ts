import { z } from "zod";
import {
  BookResolveResponseSchema,
  BookSearchResponseSchema,
  BookSearchResultSchema,
  CommentCreateResponseSchema,
  DraftCreateResponseSchema,
  LatestDraftResponseSchema,
  SessionSchema,
  type ListComment,
  SlotSnapshotResponseSchema,
  type Draft,
  type Slot,
} from "@/types/contracts";
import type { ApiError } from "@/types/errors";
import type { AuthService, BooksService, CommentsService, ListsService, Services, UsersService } from "./types";

async function parseJson<T extends z.ZodTypeAny>(res: Response, schema: T) {
  const data = await res.json().catch(() => ({}));
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw { code: "UNKNOWN", message: "Invalid response", issues: parsed.error };
  }
  return parsed.data as z.infer<T>;
}

function parseError(res: Response, body: unknown): ApiError {
  const error = typeof body === "object" && body !== null && "error" in body ? (body as { error?: { code?: string; message?: string } }).error : undefined;
  const code = error?.code || (res.status === 401 ? "AUTH_UNAUTHORIZED" : res.status === 403 ? "AUTH_FORBIDDEN" : res.status === 404 ? "NOT_FOUND" : res.status === 409 ? "CONFLICT_POSITION" : "UNKNOWN");
  return { code: code as ApiError["code"], message: error?.message };
}

const lists: ListsService = {
  async createDraft(input) {
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: input.title, description: input.description ?? null }),
    });
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data = await parseJson(res, DraftCreateResponseSchema);
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
  async setSlot(listId, bookId, position, opts) {
    const res = await fetch(`/api/lists/${listId}/slots/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, position, clientRequestId: opts?.clientRequestId }),
    });
    const body = await res.json().catch(() => ({}));
    const parsed = SlotSnapshotResponseSchema.safeParse(body);
    const slots = parsed.success ? parsed.data.slots : ([] as Slot[]);
    if (!res.ok) return { slots, error: parseError(res, body) };
    return { slots };
  },
  async removeSlot(listId, position) {
    const res = await fetch(`/api/lists/${listId}/slots?position=${position}`, { method: "DELETE" });
    const body = await res.json().catch(() => ({}));
    const parsed = SlotSnapshotResponseSchema.safeParse(body);
    if (!res.ok) return { slots: parsed.success ? parsed.data.slots : [], error: parseError(res, body) };
    return { slots: parsed.success ? parsed.data.slots : [] };
  },
  async publish(listId) {
    const res = await fetch(`/api/lists/${listId}/publish`, { method: "POST" });
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
  },
};

const books: BooksService = {
  async search(q, opts) {
    const params = new URLSearchParams({ q });
    if (opts?.limit) params.set("limit", String(opts.limit));
    const res = await fetch(`/api/books/search?${params.toString()}`);
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data = await parseJson(res, BookSearchResponseSchema);
    return data.books.map((book) => BookSearchResultSchema.parse(book));
  },
  async resolve(book) {
    const res = await fetch("/api/books/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(book),
    });
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data = await parseJson(res, BookResolveResponseSchema);
    return { bookId: data.bookId, slug: data.slug };
  },
};

const auth: AuthService = {
  async getSession() {
    const res = await fetch("/api/auth/session");
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return null;
    const parsed = SessionSchema.safeParse(data);
    if (!parsed.success) return null;
    return parsed.data;
  },
  async signIn(input) {
    const mod = await import("next-auth/react");
    const res = await mod.signIn(input.provider, {
      email: input.email,
      name: input.name,
      redirect: input.redirect !== false,
      callbackUrl: input.callbackUrl ?? "/create",
    });
    return { ok: !!(res?.ok || res?.url), url: res?.url ?? null, error: res?.error ?? null };
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
    const user = body.user as { id: number; handle: string; email: string | null; name: string | null; avatarUrl: string | null };
    return {
      id: Number(user.id),
      handle: String(user.handle),
      email: user.email ?? null,
      name: user.name ?? null,
      avatarUrl: user.avatarUrl ?? null,
    };
  },
};

const comments: CommentsService = {
  async create(listId, body) {
    const res = await fetch(`/api/lists/${listId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) throw parseError(res, await res.json().catch(() => null));
    const data = await parseJson(res, CommentCreateResponseSchema);
    return data.comment as ListComment;
  },
};

export const apiAdapter: Services = { lists, books, auth, users, comments };
