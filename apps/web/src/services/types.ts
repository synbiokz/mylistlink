import type { Draft, SearchItem, Slot } from "@/types/contracts";
import type { ApiError } from "@/types/errors";

export type SlotsResult = { slots: Slot[]; error?: ApiError };

export interface ListsService {
  createDraft(input: { title: string; description?: string | null }): Promise<{ id: number; slug: string }>;
  getLatestDraft(): Promise<Draft | null>;
  setSlot(listId: number, itemId: number, position: number, opts?: { clientRequestId?: string }): Promise<SlotsResult>;
  removeSlot(listId: number, position: number): Promise<SlotsResult>;
  publish(listId: number): Promise<void>;
}

export interface ItemsService {
  resolve(item: SearchItem): Promise<{ itemId: number; slug?: string }>;
}

export interface SearchService {
  search(q: string, opts?: { type?: string; limit?: number }): Promise<SearchItem[]>;
  searchGrouped(q: string, opts?: { type?: string; limit?: number; expand?: boolean }): Promise<any>;
}

export interface AuthService {
  getSession(): Promise<{ user: { id: number; email: string | null; name: string | null } } | null>;
  signIn(input: { provider: "credentials"; email: string; name?: string; callbackUrl?: string; redirect?: boolean }): Promise<{
    ok: boolean;
    url?: string | null;
    error?: string | null;
  }>;
  signOut(input?: { callbackUrl?: string; redirect?: boolean }): Promise<void>;
}

export interface UsersService {
  getMe(): Promise<{ id: number; handle: string; email: string | null; name: string | null; avatarUrl: string | null } | null>;
}

export interface Services {
  lists: ListsService;
  items: ItemsService;
  search: SearchService;
  auth: AuthService;
  users?: UsersService;
}
