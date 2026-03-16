"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

type Result = {
  key: string;
  label: string;
  subtitle?: string;
  href: string;
};

type SuggestData = {
  recentLists: Array<{ title: string; slug: string }>;
  topUsers: Array<{ handle: string; name?: string | null }>;
  hotBooks: Array<{ slug: string; title: string }>;
};

export function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [suggest, setSuggest] = useState<SuggestData | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const debouncedQ = useDebounce(q, 250);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && (e.target as HTMLElement)?.tagName !== "INPUT") {
        e.preventDefault();
        (boxRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open || q.trim()) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/suggest");
        const data = (await res.json()) as SuggestData;
        if (!cancelled) setSuggest(data);
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
    (async () => {
      const query = debouncedQ.trim();
      if (query.length < 2) {
        setResults([]);
        return;
      }

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (cancelled) return;

        const next: Result[] = [
          ...(data.users || []).map((user: { handle: string; name?: string | null }) => ({
            key: `user:${user.handle}`,
            label: user.name ?? user.handle,
            subtitle: `@${user.handle}`,
            href: `/user/${user.handle}`,
          })),
          ...(data.lists || []).map((list: { slug: string; title: string }) => ({
            key: `list:${list.slug}`,
            label: list.title,
            subtitle: "list",
            href: `/list/${list.slug}`,
          })),
          ...(data.books || []).map((book: { slug: string; canonicalTitle: string; author: { name: string } }) => ({
            key: `book:${book.slug}`,
            label: book.canonicalTitle,
            subtitle: book.author.name,
            href: `/book/${book.slug}`,
          })),
        ];

        setResults(next.slice(0, 10));
      } catch {
        if (!cancelled) setResults([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQ]);

  return (
    <div className="relative" ref={boxRef}>
      <Input
        placeholder="Search books, lists, and readers... (/)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 100)}
        aria-label="Search"
      />
      {open ? (
        <div className="absolute z-50 mt-2 w-full surface p-2">
          {q.trim().length < 2 && suggest ? (
            <div className="space-y-3">
              <SuggestionRow
                label="Hot books"
                items={(suggest.hotBooks || []).map((book) => ({ key: `book:${book.slug}`, label: book.title, href: `/book/${book.slug}` }))}
                onSelect={(href) => router.push(href)}
              />
              <SuggestionRow
                label="Recent lists"
                items={(suggest.recentLists || []).map((list) => ({ key: `list:${list.slug}`, label: list.title, href: `/list/${list.slug}` }))}
                onSelect={(href) => router.push(href)}
              />
              <SuggestionRow
                label="Readers"
                items={(suggest.topUsers || []).map((user) => ({ key: `user:${user.handle}`, label: `@${user.handle}`, href: `/user/${user.handle}` }))}
                onSelect={(href) => router.push(href)}
              />
            </div>
          ) : results.length === 0 ? (
            <div className="px-2 py-1 text-sm muted">No results</div>
          ) : (
            <ul className="text-sm">
              {results.map((result) => (
                <li
                  key={result.key}
                  className="cursor-pointer rounded-md px-2 py-1 hover:bg-[rgb(var(--color-accent))]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => router.push(result.href)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>{result.label}</span>
                    {result.subtitle ? <span className="text-xs muted">{result.subtitle}</span> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SuggestionRow({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: Array<{ key: string; label: string; href: string }>;
  onSelect: (href: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-xs muted">{label}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.key}
            className="rounded-md bg-[rgb(var(--color-accent))] px-2 py-1 text-sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(item.href)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function useDebounce<T>(value: T, delay = 250) {
  const [next, setNext] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setNext(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return next;
}
