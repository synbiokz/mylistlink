import { ListCard } from "@/components/domain/ListCard";
import { getNewestListPreviews } from "@/data/discovery";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  const lists = await getNewestListPreviews(18);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Lists</h1>
        <p className="muted mt-2">Public 7-book lists published by the community.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {lists.map((list) => (
          <ListCard
            key={list.id}
            title={list.title}
            description={list.description}
            href={`/list/${list.slug}`}
            owner={{
              handle: list.owner.handle,
              name: list.owner.name ?? list.owner.handle,
              avatarUrl: list.owner.avatarUrl,
            }}
            previewItems={list.previewBooks}
            publishedLabel={list.publishedAt ? new Date(list.publishedAt).toLocaleDateString() : "Published"}
            metrics={{ likes: list.likesCount, saves: list.savesCount }}
          />
        ))}
      </div>
    </div>
  );
}
