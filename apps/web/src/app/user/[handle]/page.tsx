import Link from "next/link";
import { notFound } from "next/navigation";
import { UserBar } from "@/components/domain/UserBar";
import { ListCard } from "@/components/domain/ListCard";
import { getUserPageData } from "@/data/discovery";

export const dynamic = "force-dynamic";

export default async function UserPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const data = await getUserPageData(handle);
  if (!data) return notFound();

  return (
    <div className="space-y-8">
      <UserBar name={data.user.name ?? handle} handle={handle} avatarUrl={data.user.avatarUrl ?? null} />

      <section className="space-y-3">
        <h2 className="h2">Published lists</h2>
        {data.lists.length === 0 ? (
          <div className="text-sm muted">No published lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.lists.map((list) => (
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
        <h2 className="h2">Signature books</h2>
        {data.signatureBooks.length === 0 ? (
          <div className="text-sm muted">No repeated books yet.</div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {data.signatureBooks.map((book) => (
              <Link key={book.id} href={`/book/${book.slug}`} className="rounded-full border border-[rgb(var(--color-border))] bg-white/60 px-4 py-2 text-sm">
                {book.title} <span className="muted">({book.count})</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
