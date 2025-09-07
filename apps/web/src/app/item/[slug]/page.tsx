import { ListCard } from "@/components/domain/ListCard";
import { TrailChips } from "@/components/domain/TrailChips";
import { getItemBySlug, listsForItem } from "@/data/items";
import { notFound } from "next/navigation";

export default async function ItemPage({ params }: { params: { slug: string } }) {
  const item = await getItemBySlug(params.slug);
  if (!item) return notFound();
  const lists = await listsForItem(item.id, 12);
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="display">{item.title ?? item.url ?? "Item"}</h1>
        <p className="muted">Appears in {lists.length} lists</p>
      </header>

      <section className="space-y-3">
        <h2 className="h2">Lists with this item</h2>
        {lists.length === 0 ? (
          <div className="muted text-sm">No lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {lists.map((l) => (
              <ListCard key={l.id} title={l.title} href={`/list/${l.slug}`} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="h2">Trails</h2>
        <TrailChips />
      </section>
    </div>
  );
}
