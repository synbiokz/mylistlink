// Path: apps/web/src/components/search/SearchBox.tsx
// NOTE: New file. UI-only typeahead with keyboard focus shortcut (/). Safe to wire to API later.
"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";

type Result = { id: string; label: string; type: "item" | "list"; href: string };

export function SearchBox() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

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

  // Placeholder client-side matching (replace with API later)
  useEffect(() => {
    if (q.trim().length === 0) {
      setResults([]);
      setOpen(false);
      return;
    }
    const fake: Result[] = [];
    setResults(fake);
    setOpen(true);
  }, [q]);

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
          {results.length === 0 ? (
            <div className="text-sm muted px-2 py-1">No results yet</div>
          ) : (
            <ul className="text-sm">
              {results.map((r) => (
                <li key={r.id} className="px-2 py-1 rounded-md hover:bg-[rgb(var(--color-accent))]">
                  <a href={r.href}>{r.label}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

