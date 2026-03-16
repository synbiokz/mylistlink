"use client";

import { useState } from "react";

type Props = {
  listId: number;
  shareUrl: string;
  initial: {
    likesCount: number;
    savesCount: number;
    liked?: boolean;
    saved?: boolean;
  };
};

export function ReactionBar({ listId, shareUrl, initial }: Props) {
  const [state, setState] = useState({
    likesCount: initial.likesCount,
    savesCount: initial.savesCount,
    liked: !!initial.liked,
    saved: !!initial.saved,
  });
  const [pending, setPending] = useState<"like" | "save" | null>(null);
  const [copied, setCopied] = useState(false);

  async function toggle(kind: "like" | "save") {
    try {
      setPending(kind);
      const res = await fetch(`/api/lists/${listId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        }
        return;
      }
      const next = await res.json();
      setState({
        likesCount: next.likesCount ?? 0,
        savesCount: next.savesCount ?? 0,
        liked: !!next.liked,
        saved: !!next.saved,
      });
    } finally {
      setPending(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <button
        className={`rounded-full px-3 py-2 transition ${state.liked ? "bg-[rgb(var(--color-fg))] text-[rgb(var(--color-bg))]" : "bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-border))]"}`}
        disabled={pending !== null}
        onClick={() => toggle("like")}
      >
        Like {state.likesCount}
      </button>
      <button
        className={`rounded-full px-3 py-2 transition ${state.saved ? "bg-[rgb(var(--color-brand-500))] text-white" : "bg-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-border))]"}`}
        disabled={pending !== null}
        onClick={() => toggle("save")}
      >
        Save {state.savesCount}
      </button>
      <button className="rounded-full bg-[rgb(var(--color-accent))] px-3 py-2 transition hover:bg-[rgb(var(--color-border))]" onClick={copyLink}>
        {copied ? "Copied" : "Share"}
      </button>
    </div>
  );
}
