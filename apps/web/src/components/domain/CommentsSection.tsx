"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { getServices } from "@/services";
import { clearPendingComment, loadPendingComment, savePendingComment } from "@/lib/guestStorage";
import { useSession } from "@/hooks/useSession";
import type { ListComment } from "@/types/contracts";
import { friendlyMessage } from "@/types/errors";

export function CommentsSection({
  listId,
  listSlug,
  initialComments,
}: {
  listId: number;
  listSlug: string;
  initialComments: ListComment[];
}) {
  const session = useSession();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !session.data?.user || submitting) return;
    const pending = loadPendingComment();
    if (!pending || pending.listId !== listId || !pending.body.trim()) return;
    const pendingBody = pending.body;

    let cancelled = false;
    async function flushPendingComment() {
      setSubmitting(true);
      try {
        const comment = await getServices().comments.create(listId, pendingBody);
        if (!cancelled) {
          setComments((current) => [...current, comment]);
          clearPendingComment();
          setNotice("Your comment is now live.");
        }
      } catch (error) {
        if (!cancelled) setNotice(friendlyMessage(error as never));
      } finally {
        if (!cancelled) setSubmitting(false);
      }
    }

    void flushPendingComment();
    return () => {
      cancelled = true;
    };
  }, [hydrated, listId, session.data?.user, submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || submitting) return;

    if (!session.data?.user) {
      savePendingComment({ listId, listSlug, body: trimmed });
      window.location.href = `/signin?callbackUrl=${encodeURIComponent(`/list/${listSlug}`)}`;
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const comment = await getServices().comments.create(listId, trimmed);
      setComments((current) => [...current, comment]);
      setBody("");
    } catch (error) {
      setNotice(friendlyMessage(error as never));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="h2">Comments</h2>
        <p className="mt-2 text-sm muted">Read anonymously. Post after you finish with email.</p>
      </div>

      <form onSubmit={onSubmit} className="surface space-y-3 p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add your take on this list..."
          className="min-h-28 w-full rounded-[var(--radius-md)] border border-[rgb(var(--color-border))] bg-white/80 p-3 text-sm focus-ring"
          maxLength={1000}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs muted">{body.trim().length}/1000</div>
          <Button type="submit" variant="primary" disabled={submitting || !body.trim()}>
            {session.data?.user ? (submitting ? "Posting..." : "Post comment") : "Continue with email to post"}
          </Button>
        </div>
        {notice ? <p className="text-sm muted">{notice}</p> : null}
      </form>

      {comments.length === 0 ? (
        <div className="text-sm muted">No comments yet.</div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <article key={comment.id} className="surface p-4">
              <div className="mb-3 flex items-center gap-3">
                <Avatar size={20} alt={comment.author.name ?? comment.author.handle} src={comment.author.avatarUrl ?? null} />
                <div className="text-sm">
                  <div className="font-medium">{comment.author.name ?? comment.author.handle}</div>
                  <div className="muted">@{comment.author.handle} / {new Date(comment.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <p className="text-sm leading-6">{comment.body}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
