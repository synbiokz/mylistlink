"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateDraft, useLatestDraft } from "@/hooks/useDraft";
import { useBookSearch } from "@/hooks/useSearch";
import { usePublishList, useRemoveSlot, useSetSlot } from "@/hooks/useSlots";
import { useSession } from "@/hooks/useSession";
import { friendlyMessage } from "@/types/errors";
import type { BookSearchResult, Slot } from "@/types/contracts";
import { getServices } from "@/services";
import { clearGuestDraft, loadGuestDraft, saveGuestDraft, type GuestDraft } from "@/lib/guestStorage";

type EditorSlot = Slot & {
  candidate: BookSearchResult | null;
};

function emptySlots(): EditorSlot[] {
  return Array.from({ length: 7 }, (_, index) => ({
    position: index + 1,
    bookId: null,
    title: null,
    slug: null,
    authorName: null,
    coverUrl: null,
    candidate: null,
  }));
}

function toGuestDraft(title: string, description: string, slots: EditorSlot[], shouldPublish = false): GuestDraft {
  return {
    title,
    description,
    shouldPublish,
    slots: slots.map((slot) => ({
      position: slot.position,
      book: slot.candidate,
    })),
  };
}

function fromGuestDraft(draft: GuestDraft): EditorSlot[] {
  return Array.from({ length: 7 }, (_, index) => {
    const entry = draft.slots.find((slot) => slot.position === index + 1)?.book ?? null;
    return {
      position: index + 1,
      bookId: null,
      title: entry?.title ?? null,
      slug: null,
      authorName: entry?.authorName ?? null,
      coverUrl: entry?.coverUrl ?? null,
      candidate: entry,
    };
  });
}

function withCandidate(position: number, result: BookSearchResult): EditorSlot {
  return {
    position,
    bookId: null,
    title: result.title,
    slug: null,
    authorName: result.authorName ?? null,
    coverUrl: result.coverUrl ?? null,
    candidate: result,
  };
}

function asEditorSlots(slots: Slot[]): EditorSlot[] {
  return slots.map((slot) => ({
    ...slot,
    candidate: null,
  }));
}

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [list, setList] = useState<{ id: number; slug: string } | null>(null);
  const [q, setQ] = useState("");
  const [slots, setSlots] = useState<EditorSlot[]>(emptySlots());
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingPos, setPendingPos] = useState<number | null>(null);
  const [guestReady, setGuestReady] = useState(false);
  const [usingGuestDraft, setUsingGuestDraft] = useState(false);
  const [syncingGuestDraft, setSyncingGuestDraft] = useState(false);

  const filled = slots.filter((slot) => slot.bookId != null || slot.candidate != null).length;
  const session = useSession();
  const signedIn = !!session.data?.user;
  const sessionResolved = session.isFetched;
  const { data: draft } = useLatestDraft({ enabled: signedIn && !usingGuestDraft });
  const { mutateAsync: createDraft } = useCreateDraft();
  const search = useBookSearch(q, { enabled: true, limit: 10 });
  const publishMut = usePublishList(list?.id || 0);
  const setSlotMut = useSetSlot(list?.id || 0);
  const removeSlotMut = useRemoveSlot(list?.id || 0);

  const guestDraftSnapshot = useMemo(() => toGuestDraft(title, description, slots), [description, slots, title]);

  useEffect(() => {
    if (!sessionResolved || guestReady) return;
    const guestDraft = loadGuestDraft();
    if (guestDraft) {
      setTitle(guestDraft.title);
      setDescription(guestDraft.description);
      setSlots(fromGuestDraft(guestDraft));
      setStep(guestDraft.title.trim() ? 2 : 1);
      setUsingGuestDraft(true);
    } else if (!signedIn) {
      setUsingGuestDraft(true);
    }
    setGuestReady(true);
  }, [guestReady, sessionResolved, signedIn]);

  useEffect(() => {
    if (usingGuestDraft) return;
    if (!draft) return;
    setList({ id: draft.id, slug: draft.slug });
    setTitle(draft.title ?? "");
    setDescription(draft.description ?? "");
    if (Array.isArray(draft.slots)) setSlots(asEditorSlots(draft.slots));
    setStep(2);
  }, [draft, usingGuestDraft]);

  useEffect(() => {
    if (!guestReady || !usingGuestDraft) return;
    saveGuestDraft(guestDraftSnapshot);
  }, [guestDraftSnapshot, guestReady, usingGuestDraft]);

  useEffect(() => {
    if (!guestReady || !signedIn || !usingGuestDraft || syncingGuestDraft) return;
    const persistedGuestDraft = loadGuestDraft();
    if (!persistedGuestDraft) return;

    let cancelled = false;
    async function syncGuestDraft() {
      const guestDraft = persistedGuestDraft;
      if (!guestDraft) return;
      setSyncingGuestDraft(true);
      try {
        const created = await getServices().lists.createDraft({
          title: guestDraft.title.trim() || "Untitled list",
          description: guestDraft.description || null,
        });

        let latestSlots: Slot[] = emptySlots().map((slot) => ({
          position: slot.position,
          bookId: slot.bookId,
          title: slot.title,
          slug: slot.slug,
          authorName: slot.authorName,
          coverUrl: slot.coverUrl,
        }));
        for (const slot of guestDraft.slots) {
          if (!slot.book) continue;
          const resolved = await getServices().books.resolve(slot.book);
          const response = await getServices().lists.setSlot(created.id, resolved.bookId, slot.position);
          if (response.error) throw response.error;
          latestSlots = response.slots;
        }

        if (cancelled) return;

        setList(created);
        setSlots(asEditorSlots(latestSlots));
        setUsingGuestDraft(false);
        clearGuestDraft();
        setNotice(
          guestDraft.shouldPublish ? "Saving your draft before publishing..." : "Your guest draft is now saved to your account."
        );

        if (guestDraft.shouldPublish && latestSlots.filter((slot) => slot.bookId != null).length === 7) {
          await getServices().lists.publish(created.id);
          if (!cancelled) window.location.href = `/list/${created.slug}`;
          return;
        }
      } catch (error) {
        if (!cancelled) setNotice(friendlyMessage(error as never));
      } finally {
        if (!cancelled) setSyncingGuestDraft(false);
      }
    }

    void syncGuestDraft();
    return () => {
      cancelled = true;
    };
  }, [guestReady, signedIn, syncingGuestDraft, usingGuestDraft]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 2200);
  }

  async function onCreateDraft() {
    try {
      if (usingGuestDraft) {
        setStep(2);
        return;
      }
      if (list) {
        setStep(2);
        return;
      }
      const next = await createDraft({ title, description });
      setList(next);
      setSlots(emptySlots());
      setStep(2);
    } catch (error) {
      showNotice(friendlyMessage(error as never));
    }
  }

  async function addAt(positionIndex: number, result: BookSearchResult) {
    if (usingGuestDraft || !list) {
      setSlots((current) =>
        current.map((slot, index) => (index === positionIndex ? withCandidate(positionIndex + 1, result) : slot))
      );
      return;
    }
    try {
      setPendingPos(positionIndex + 1);
      const resolved = await getServices().books.resolve(result);
      const clientRequestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const response = await setSlotMut.mutateAsync({
        bookId: resolved.bookId,
        position: positionIndex + 1,
        clientRequestId,
      });
      if (response.error) showNotice(friendlyMessage(response.error));
      setSlots(asEditorSlots(response.slots));
    } catch (error) {
      showNotice(friendlyMessage(error as never));
    } finally {
      setPendingPos(null);
    }
  }

  async function removeAt(positionIndex: number) {
    if (usingGuestDraft || !list) {
      setSlots((current) =>
        current.map((slot, index) => (index === positionIndex ? emptySlots()[positionIndex] : slot))
      );
      return;
    }
    try {
      setPendingPos(positionIndex + 1);
      const response = await removeSlotMut.mutateAsync({ position: positionIndex + 1 });
      setSlots(asEditorSlots(response.slots));
    } catch (error) {
      showNotice(friendlyMessage(error as never));
    } finally {
      setPendingPos(null);
    }
  }

  async function publish() {
    if (usingGuestDraft || !list) {
      if (filled !== 7) return;
      saveGuestDraft(toGuestDraft(title, description, slots, true));
      window.location.href = `/signin?callbackUrl=${encodeURIComponent("/create")}`;
      return;
    }
    try {
      await publishMut.mutateAsync();
      window.location.href = `/list/${list.slug}`;
    } catch (error) {
      showNotice(friendlyMessage(error as never));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Create a 7-book list</h1>
        <p className="muted mt-2">Build your list anonymously. We only save it to the site after you finish with email.</p>
      </div>

      {step === 1 ? (
        <div className="surface max-w-xl space-y-4 p-4">
          <div>
            <label className="mb-1 block text-sm">List title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="7 bleak sci-fi books" />
          </div>
          <div>
            <label className="mb-1 block text-sm">One-line description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional, but useful for context." />
          </div>
          <Button variant="primary" disabled={!title.trim() || syncingGuestDraft} onClick={onCreateDraft}>
            {syncingGuestDraft ? "Saving..." : "Continue"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-12">
          <div className="space-y-3 md:col-span-4">
            <div className="surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium">Books ({filled}/7)</div>
                <Button
                  onClick={publish}
                  disabled={filled !== 7 || publishMut.isPending || syncingGuestDraft}
                  variant={filled === 7 ? "primary" : "ghost"}
                >
                  {usingGuestDraft ? "Continue with email to publish" : "Publish"}
                </Button>
              </div>
              {notice ? <div className="mb-2 rounded bg-[rgb(var(--color-accent))] px-3 py-1 text-sm">{notice}</div> : null}
              <ol className="grid grid-cols-1 gap-2">
                {slots.map((slot, index) => (
                  <li key={slot.position} className="rounded border p-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span>Position {index + 1}</span>
                      {slot.bookId || slot.candidate ? (
                        <button
                          className="underline disabled:opacity-50"
                          onClick={() => removeAt(index)}
                          disabled={pendingPos === index + 1 || removeSlotMut.isPending}
                        >
                          remove
                        </button>
                      ) : null}
                    </div>
                    {slot.bookId || slot.candidate ? (
                      <div>
                        <div>{slot.title}</div>
                        <div className="text-xs muted">{slot.authorName}</div>
                      </div>
                    ) : (
                      <div className="text-sm muted">{pendingPos === index + 1 && setSlotMut.isPending ? "Placing..." : "Empty"}</div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="surface p-3 md:col-span-8">
            <div className="mb-2 font-medium">Search books</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or author" />
            <ul className="mt-3 max-h-[70vh] overflow-auto pr-1 text-sm">
              {(search.data || []).map((result, index) => (
                <li key={`${result.sourceId}:${index}`} className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0">
                  <div className="flex min-w-0 items-center gap-3">
                    {result.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={result.coverUrl} alt={result.title} className="h-16 w-12 rounded-sm object-cover" />
                    ) : (
                      <div className="h-16 w-12 rounded-sm bg-[rgb(var(--color-accent))]" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium">{result.title}</div>
                      <div className="text-xs muted">
                        {[result.authorName, result.publicationYear].filter(Boolean).join(" / ")}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {slots.map((slot) => (
                      <Button
                        key={slot.position}
                        size="sm"
                        variant="ghost"
                        onClick={() => addAt(slot.position - 1, result)}
                        disabled={setSlotMut.isPending && pendingPos !== null}
                      >
                        {slot.position}
                      </Button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
