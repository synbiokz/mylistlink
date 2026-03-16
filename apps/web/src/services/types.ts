import type { BookSearchResult, Draft, Slot } from "@/types/contracts";
import type { ApiError } from "@/types/errors";

export type SlotsResult = { slots: Slot[]; error?: ApiError };

export interface ListsService {
  createDraft(input: { title: string; description?: string | null }): Promise<{ id: number; slug: string }>;
  getLatestDraft(): Promise<Draft | null>;
  setSlot(listId: number, bookId: number, position: number, opts?: { clientRequestId?: string }): Promise<SlotsResult>;
  removeSlot(listId: number, position: number): Promise<SlotsResult>;
  publish(listId: number): Promise<void>;
}

export interface BooksService {
  search(q: string, opts?: { limit?: number }): Promise<BookSearchResult[]>;
  resolve(candidate: BookSearchResult): Promise<{ bookId: number; slug: string }>;
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
  books: BooksService;
  auth: AuthService;
  users?: UsersService;
}
