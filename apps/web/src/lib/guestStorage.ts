"use client";

import type { BookSearchResult } from "@/types/contracts";

const GUEST_DRAFT_KEY = "listlink:guest-draft";
const PENDING_COMMENT_KEY = "listlink:pending-comment";

export type GuestDraft = {
  title: string;
  description: string;
  slots: Array<{ position: number; book: BookSearchResult | null }>;
  shouldPublish: boolean;
};

export type PendingComment = {
  listId: number;
  listSlug: string;
  body: string;
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function loadGuestDraft() {
  const draft = readJson<GuestDraft>(GUEST_DRAFT_KEY);
  if (!draft) return null;
  const hasContent =
    draft.title.trim().length > 0 ||
    draft.description.trim().length > 0 ||
    draft.slots.some((slot) => slot.book != null);
  return hasContent ? draft : null;
}

export function saveGuestDraft(draft: GuestDraft) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
}

export function clearGuestDraft() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(GUEST_DRAFT_KEY);
}

export function loadPendingComment() {
  return readJson<PendingComment>(PENDING_COMMENT_KEY);
}

export function savePendingComment(comment: PendingComment) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PENDING_COMMENT_KEY, JSON.stringify(comment));
}

export function clearPendingComment() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(PENDING_COMMENT_KEY);
}
