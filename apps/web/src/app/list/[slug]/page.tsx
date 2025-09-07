import { ReactionBar } from "@/components/domain/ReactionBar";
import { OverlapPanel } from "@/components/domain/OverlapPanel";
import { TrailChips } from "@/components/domain/TrailChips";
import { getBySlug } from "@/data/lists";
import { overlapsForList } from "@/data/overlaps";
import { notFound } from "next/navigation";

export default async function ListPage({ params }: { params: { slug: string } }) {
  const list = await getBySlug(params.slug);
  if (!list) return notFound();
  const overlaps = await overlapsForList(list.id, 6);
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="display">{list.title}</h1>
        <p className="muted">By {list.owner?.name ?? "@user"} {list.publishedAt ? `• ${new Date(list.publishedAt).toDateString()}` : ""}</p>
        <ReactionBar />
      </header>

      <section className="space-y-3">
        <ol className="space-y-2">
          {list.items.map((li, i) => (
            <li key={li.itemId} className="flex items-start gap-3">
              <div className="font-mono text-sm mt-1">{i + 1}.</div>
              <div className="flex-1 surface p-3">
                {li.item.title ?? li.item.url ?? "Untitled"}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="h2">Follow the trail</h2>
        <TrailChips />
      </section>

      <section className="space-y-3">
        <h3 className="h2">Overlaps</h3>
        <div className="grid grid-cols-1 gap-4">
          {overlaps.length === 0 ? (
            <div className="muted text-sm">No overlaps yet.</div>
          ) : (
            overlaps.map((o) => (
              <div key={o.list.id} className="surface p-4 flex items-center justify-between">
                <div className="truncate">{o.list.title}</div>
                <div className="text-xs bg-[rgb(var(--color-accent))] px-2 py-1 rounded-md">{o.overlap}/7</div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
