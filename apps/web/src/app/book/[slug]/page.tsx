import Link from "next/link";
import { notFound } from "next/navigation";
import { ListCard } from "@/components/domain/ListCard";
import { getBookPageData } from "@/data/discovery";

export const dynamic = "force-dynamic";

type BookPageData = NonNullable<Awaited<ReturnType<typeof getBookPageData>>>;
type BookList = BookPageData["lists"][number];

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getBookPageData(slug);
  if (!data) return notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="eyebrow">Canonical book page</div>
        <h1 className="display">{data.book.canonicalTitle}</h1>
        <p className="muted">{data.book.author.name}{data.book.publicationYear ? ` / ${data.book.publicationYear}` : ""}</p>
        <div className="text-sm muted">Appears on {data.listCount} published lists</div>
        {data.book.genrePrimary ? <div className="text-sm muted">Primary genre: {data.book.genrePrimary}</div> : null}
      </header>

      <section className="space-y-3">
        <h2 className="h2">Featured lists containing this book</h2>
        {data.lists.length === 0 ? (
          <div className="text-sm muted">No lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.lists.map((list: BookList) => (
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
                metrics={{ likes: list.likesCount, saves: list.savesCount }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="h2">Next click</h2>
        <div className="text-sm muted">Follow a list above to see how this book changes meaning in different themes.</div>
        <Link href="/discover" className="text-sm font-medium hover:underline">Back to discovery</Link>
      </section>
    </div>
  );
}
