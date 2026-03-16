"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateDraft, useLatestDraft } from "@/hooks/useDraft";
import { useBookSearch } from "@/hooks/useSearch";
import { usePublishList, useRemoveSlot, useSetSlot } from "@/hooks/useSlots";
import { friendlyMessage } from "@/types/errors";
import type { BookSearchResult, Slot } from "@/types/contracts";
import { getServices } from "@/services";

function emptySlots(): Slot[] {
  return Array.from({ length: 7 }, (_, index) => ({
    position: index + 1,
    bookId: null,
    title: null,
    slug: null,
    authorName: null,
    coverUrl: null,
  }));
}

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [list, setList] = useState<{ id: number; slug: string } | null>(null);
  const [q, setQ] = useState("");
  const [slots, setSlots] = useState<Slot[]>(emptySlots());
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingPos, setPendingPos] = useState<number | null>(null);

  const filled = slots.filter((slot) => slot.bookId != null).length;
  const { data: draft } = useLatestDraft();
  const { mutateAsync: createDraft } = useCreateDraft();
  const search = useBookSearch(q, { enabled: true, limit: 10 });
  const publishMut = usePublishList(list?.id || 0);
  const setSlotMut = useSetSlot(list?.id || 0);
  const removeSlotMut = useRemoveSlot(list?.id || 0);

  useEffect(() => {
    if (!draft) return;
    setList({ id: draft.id, slug: draft.slug });
    setTitle(draft.title ?? "");
    setDescription(draft.description ?? "");
    if (Array.isArray(draft.slots)) setSlots(draft.slots);
  }, [draft]);

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 2200);
  }

  async function onCreateDraft() {
    try {
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
    if (!list) return;
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
      setSlots(response.slots);
    } catch (error) {
      showNotice(friendlyMessage(error as never));
    } finally {
      setPendingPos(null);
    }
  }

  async function removeAt(positionIndex: number) {
    if (!list) return;
    try {
      setPendingPos(positionIndex + 1);
      const response = await removeSlotMut.mutateAsync({ position: positionIndex + 1 });
      setSlots(response.slots);
    } catch (error) {
      showNotice(friendlyMessage(error as never));
    } finally {
      setPendingPos(null);
    }
  }

  async function publish() {
    if (!list) return;
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
        <p className="muted mt-2">Good lists are opinionated, specific, and personal. The overlap graph does the rest.</p>
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
          <Button variant="primary" disabled={!title.trim()} onClick={onCreateDraft}>
            Continue
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-12">
          <div className="space-y-3 md:col-span-4">
            <div className="surface p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium">Books ({filled}/7)</div>
                <Button onClick={publish} disabled={filled !== 7 || publishMut.isPending} variant={filled === 7 ? "primary" : "ghost"}>
                  Publish
                </Button>
              </div>
              {notice ? <div className="mb-2 rounded bg-[rgb(var(--color-accent))] px-3 py-1 text-sm">{notice}</div> : null}
              <ol className="grid grid-cols-1 gap-2">
                {slots.map((slot, index) => (
                  <li key={slot.position} className="rounded border p-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span>Position {index + 1}</span>
                      {slot.bookId ? (
                        <button
                          className="underline disabled:opacity-50"
                          onClick={() => removeAt(index)}
                          disabled={pendingPos === index + 1 || removeSlotMut.isPending}
                        >
                          remove
                        </button>
                      ) : null}
                    </div>
                    {slot.bookId ? (
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
