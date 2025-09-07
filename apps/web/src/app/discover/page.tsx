import { listRecentPublished } from "@/data/lists";
import { ListCard } from "@/components/domain/ListCard";

export default async function DiscoverPage() {
  const recent = await listRecentPublished(9);
  return (
    <div className="space-y-6">
      <h1 className="h1">Discover</h1>
      <p className="muted">Trending Items • Hot Overlaps • New Today</p>
      {recent.length === 0 ? (
        <div className="muted text-sm">Nothing yet. Create the first list!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {recent.map((l) => (
            <ListCard key={l.id} title={l.title} href={`/list/${l.slug}`} />
          ))}
        </div>
      )}
    </div>
  );
}
