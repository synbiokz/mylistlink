import { ListCard } from "@/components/domain/ListCard";
import { listRecentPublished } from "@/data/lists";

export default async function ListsPage() {
  const lists = await listRecentPublished(12);
  return (
    <div className="space-y-6">
      <h1 className="h1">Lists</h1>
      {lists.length === 0 ? (
        <div className="muted text-sm">No lists yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {lists.map((l) => (
            <ListCard key={l.id} title={l.title} href={`/list/${l.slug}`} />
          ))}
        </div>
      )}
    </div>
  );
}
