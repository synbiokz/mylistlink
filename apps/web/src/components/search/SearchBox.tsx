// Path: apps/web/src/components/search/SearchBox.tsx
// NOTE: Typeahead wired to federated external search with keyboard focus shortcut (/).
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";

type ExternalItem = {
  source: "openlibrary" | "omdb" | "wikidata";
  sourceId: string;
  title: string;
  type?: string;
  imageUrl?: string | null;
  url?: string | null;
};

type Result = { key: string; label: string; subtitle?: string; onSelect: () => void };

export function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [suggest, setSuggest] = useState<{ lists: Array<{ title: string; slug: string }>; users: Array<{ handle: string; name?: string | null }>; items: Array<{ title?: string | null; slug: string }> } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        (boxRef.current?.querySelector("input") as HTMLInputElement)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced query
  const debouncedQ = useDebounce(q, 350);

  useEffect(() => {
    // Load suggestions for empty query on first focus
    if (!open || q.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/suggest`);
        const d = await r.json();
        if (cancelled) return;
        const lists = (d?.recentLists || []).map((l: any) => ({ title: l.title as string, slug: l.slug as string }));
        const users = (d?.topUsers || []).map((u: any) => ({ handle: u.handle as string, name: (u.name as string) ?? null }));
        const items = (d?.hotItems || []).map((i: any) => ({ title: (i.title as string) ?? null, slug: i.slug as string }));
        setSuggest({ lists, users, items });
      } catch {
        if (!cancelled) setSuggest(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, q]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const query = debouncedQ.trim();
      if (!query || query.length < 2) {
        setResults([]);
        setOpen(!!suggest);
        return;
      }
      try {
        const [extRes, localRes] = await Promise.all([
          fetch(`/api/sources/search?q=${encodeURIComponent(query)}`),
          fetch(`/api/search?q=${encodeURIComponent(query)}`),
        ]);
        const data = await extRes.json();
        const local = await localRes.json();
        const items: ExternalItem[] = data?.items ?? [];
        const mappedExt: Result[] = items.slice(0, 8).map((it) => ({
          key: `${it.source}:${it.sourceId}`,
          label: it.title,
          subtitle: prettySource(it),
          onSelect: async () => {
            // Resolve to local Item and navigate to item hub
            const r = await fetch(`/api/items/resolve`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(it),
            });
            const json = await r.json();
            const slug: string | undefined = json?.item?.slug;
            if (slug) router.push(`/item/${slug}`);
          },
        }));
        const mappedLists: Result[] = (local?.lists || []).map((l: any) => ({
          key: `list:${l.slug}`,
          label: l.title,
          subtitle: "list",
          onSelect: () => router.push(`/list/${l.slug}`),
        }));
        const mappedUsers: Result[] = (local?.users || []).map((u: any) => ({
          key: `user:${u.handle}`,
          label: u.name ?? u.handle,
          subtitle: `@${u.handle}`,
          onSelect: () => router.push(`/user/${u.handle}`),
        }));
        if (!cancelled) {
          setResults([...mappedUsers.slice(0, 3), ...mappedLists.slice(0, 5), ...mappedExt]);
          setOpen(true);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
          setOpen(!!suggest);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, router, suggest]);

  return (
    <div className="relative" ref={boxRef}>
      <Input
        placeholder="Search items and lists...  (press / to focus)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        aria-label="Search"
      />
      {open && (
        <div className="absolute z-50 mt-2 w-full surface p-2">
          {q.trim().length < 2 && suggest ? (
            <div>
              <div className="mb-2 text-xs muted">Suggestions</div>
              <div className="flex flex-wrap gap-2">
                {(suggest.items || []).map((it, i) => (
                  <button key={`it-${i}`} className="px-2 py-1 rounded-md bg-[rgb(var(--color-accent))] text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => router.push(`/item/${it.slug}`)}>
                    {it.title ?? "Item"}
                  </button>
                ))}
                {(suggest.lists || []).map((l, i) => (
                  <button key={`l-${i}`} className="px-2 py-1 rounded-md bg-[rgb(var(--color-accent))] text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => router.push(`/list/${l.slug}`)}>
                    {l.title}
                  </button>
                ))}
                {(suggest.users || []).map((u, i) => (
                  <button key={`u-${i}`} className="px-2 py-1 rounded-md bg-[rgb(var(--color-accent))] text-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => router.push(`/user/${u.handle}`)}>
                    @{u.handle}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-sm muted px-2 py-1">No results</div>
          ) : (
            <ul className="text-sm">
              {results.map((r) => (
                <li
                  key={r.key}
                  className="px-2 py-1 rounded-md hover:bg-[rgb(var(--color-accent))] cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => r.onSelect()}
                >
                  <div className="flex items-center justify-between">
                    <span>{r.label}</span>
                    {r.subtitle && <span className="muted text-xs">{r.subtitle}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function prettySource(i: ExternalItem) {
  if (i.source === "omdb") return i.type ? `${i.type}` : "movie";
  if (i.source === "openlibrary") return "book";
  if (i.source === "wikidata") return i.type || "entity";
  return i.source;
}

function useDebounce<T>(value: T, delay = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
