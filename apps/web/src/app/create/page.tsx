"use client";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateDraft, useLatestDraft } from "@/hooks/useDraft";
import { usePublishList, useRemoveSlot, useSetSlot } from "@/hooks/useSlots";
import { useGroupedSearch } from "@/hooks/useSearch";
import { friendlyMessage } from "@/types/errors";
import type { SearchItem, Slot } from "@/types/contracts";
import { getServices } from "@/services";

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [list, setList] = useState<{ id: number; slug: string } | null>(null);
  const [q, setQ] = useState("");
  const [slots, setSlots] = useState<Slot[]>(Array.from({ length: 7 }, (_, i) => ({ position: i + 1, itemId: null, title: null, slug: null, url: null })));
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingPos, setPendingPos] = useState<number | null>(null);

  const filled = slots.filter((s) => s.itemId != null).length;
  const { data: draft } = useLatestDraft();
  const { mutateAsync: createDraft } = useCreateDraft();
  const dq = useDebounce(q, 300);
  const search = useGroupedSearch(dq, { enabled: true, limit: 15 });
  const publishMut = usePublishList(list?.id || 0);
  const setSlotMut = useSetSlot(list?.id || 0);
  const removeSlotMut = useRemoveSlot(list?.id || 0);

  useEffect(() => {
    if (draft) {
      setList({ id: draft.id, slug: draft.slug });
      setTitle(draft.title ?? "");
      setDescription(draft.description ?? "");
      if (Array.isArray(draft.slots)) setSlots(draft.slots);
    }
  }, [draft]);

  function showNotice(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice((cur) => (cur === msg ? null : cur)), 2200);
  }

  async function onCreateDraft() {
    try {
      // If a draft already exists, just proceed to step 2 without creating a new one
      if (list) {
        setStep(2);
        return;
      }
      const r = await createDraft({ title, description });
      setList(r);
      setSlots(Array.from({ length: 7 }, (_, i) => ({ position: i + 1, itemId: null, title: null, slug: null, url: null })));
      setStep(2);
    } catch (e: any) {
      showNotice(friendlyMessage(e));
    }
  }

  async function addAt(posIdx: number, ext: any) {
    if (!list) return;
    try {
      setPendingPos(posIdx + 1);
      // Build a SearchItem from grouped Work item by choosing best authority
      const auths: Array<{ authority: string; extId: string }> = Array.isArray(ext.authorities) ? ext.authorities : [];
      // prefer openlibrary_work, then imdb, then wikidata
      const pick = auths.find((a) => a.authority === 'openlibrary_work') || auths.find((a) => a.authority === 'imdb') || auths.find((a) => a.authority === 'wikidata') || null;
      let sel: SearchItem;
      if (pick) {
        const src = pick.authority === 'openlibrary_work' ? 'openlibrary' : pick.authority === 'imdb' ? 'omdb' : pick.authority === 'wikidata' ? 'wikidata' : 'wikidata';
        const type = (ext.kind || '').toString().toLowerCase();
        sel = { source: src as any, sourceId: pick.extId, title: ext.title as string, type, imageUrl: ext.imageUrl ?? null, url: null } as SearchItem;
      } else {
        // Fallback: treat as wikidata with normalized title
        sel = { source: 'wikidata' as any, sourceId: `${ext.title}` , title: ext.title as string, type: (ext.kind || '').toString().toLowerCase() } as any;
      }
      const resolved = await getServices().items.resolve(sel);
      const idem = (globalThis as any).crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const r = await setSlotMut.mutateAsync({ itemId: resolved.itemId, position: posIdx + 1, clientRequestId: idem });
      if (Array.isArray(r.slots)) setSlots(r.slots as Slot[]);
      if (r.error) showNotice(friendlyMessage(r.error));
    } catch (e: any) {
      const err = e as any;
      if (Array.isArray(err?.slots)) setSlots(err.slots);
      showNotice(friendlyMessage(err));
    } finally {
      setPendingPos(null);
    }
  }

  async function removeAt(posIdx: number) {
    if (!list) return;
    try {
      setPendingPos(posIdx + 1);
      const r = await removeSlotMut.mutateAsync({ position: posIdx + 1 });
      if (Array.isArray(r.slots)) setSlots(r.slots as Slot[]);
      showNotice(`Removed slot ${posIdx + 1}`);
    } catch (e: any) {
      showNotice(friendlyMessage(e));
    } finally {
      setPendingPos(null);
    }
  }

  async function publish() {
    if (!list) return;
    try {
      await publishMut.mutateAsync();
      window.location.href = `/list/${list.slug}`;
    } catch (e: any) {
      showNotice(friendlyMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="h1">Create a List</h1>
      {step === 1 ? (
        <div className="surface p-4 space-y-4 max-w-xl">
          <div>
            <label className="block text-sm mb-1">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Favorite Sci-Fi Movies" />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>
          <Button variant="primary" disabled={!title.trim()} onClick={onCreateDraft}>
            Continue
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-4 space-y-3">
            <div className="surface p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Items ({filled}/7)</div>
                <Button onClick={publish} disabled={filled !== 7 || publishMut.isPending} variant={filled === 7 ? "primary" : "ghost"}>
                  Publish
                </Button>
              </div>
              {notice && <div className="text-sm bg-[rgb(var(--color-accent))] px-3 py-1 rounded mb-2">{notice}</div>}
              <ol className="grid grid-cols-1 gap-2">
                {slots.map((s, idx) => (
                  <li key={idx} className="p-2 border rounded">
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span>Position {idx + 1}</span>
                      {s.itemId && (
                        <button
                          className="underline disabled:opacity-50"
                          onClick={() => removeAt(idx)}
                          disabled={pendingPos === idx + 1 || removeSlotMut.isPending}
                          aria-label={`Remove slot ${idx + 1}`}
                        >
                          {pendingPos === idx + 1 && removeSlotMut.isPending ? "removing..." : "remove"}
                        </button>
                      )}
                    </div>
                    {s.itemId ? (
                      <div>{s.title ?? s.url ?? `Item #${s.itemId}`}</div>
                    ) : (
                      <div className="muted text-sm">{pendingPos === idx + 1 && setSlotMut.isPending ? "Placing..." : "Empty"}</div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="md:col-span-8 surface p-3">
            <div className="font-medium mb-2">Search items</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies/books/entities" />
            <ul className="mt-3 max-h-[70vh] overflow-auto text-sm pr-1">
              {(search.data || []).map((it: any, i: number) => (
                <li key={`${it.title}:${i}`} className="py-2 flex items-center justify-between gap-3 border-b last:border-b-0">
                  <div className="flex items-center gap-3 min-w-0">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt={it.title} className="w-12 h-16 object-cover rounded-sm" />
                    ) : (
                      <div className="w-12 h-16 bg-[rgb(var(--color-accent))] rounded-sm" />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium">{it.title}</div>
                      <div className="muted text-xs">{it.creator ? `${it.creator}` : ''} {it.year ? `• ${it.year}` : ''}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {slots.map((_, idx) => (
                      <Button key={idx} size="sm" variant="ghost" onClick={() => addAt(idx, it)} disabled={setSlotMut.isPending && pendingPos !== null}>
                        {idx + 1}
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

function useDebounce<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
