import { CommentsSection } from "@/components/domain/CommentsSection";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactionBar } from "@/components/domain/ReactionBar";
import { TrailChips } from "@/components/domain/TrailChips";
import { getListPageData } from "@/data/discovery";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type ListPageData = NonNullable<Awaited<ReturnType<typeof getListPageData>>>;
type ListItem = ListPageData["list"]["items"][number];
type Trail = ListPageData["trails"][number];
type Overlap = {
  list: {
    id: number;
    slug: string;
    title: string;
    owner: {
      handle: string;
      name: string | null;
      avatarUrl: string | null;
    };
  };
  overlap: number;
  similarity: number;
};

export default async function ListPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const rawViewerId = session?.user?.id ? Number(session.user.id) : null;
  const viewerId = rawViewerId && Number.isInteger(rawViewerId) ? rawViewerId : null;
  const data = await getListPageData(slug, viewerId);
  if (!data) return notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="eyebrow">Public list</div>
        <h1 className="display">{data.list.title}</h1>
        <p className="muted">
          By <Link href={`/user/${data.list.owner.handle}`} className="hover:underline">@{data.list.owner.handle}</Link>
          {data.list.publishedAt ? ` / ${new Date(data.list.publishedAt).toDateString()}` : ""}
        </p>
        {data.list.description ? <p className="max-w-3xl text-base leading-7 muted">{data.list.description}</p> : null}
        <ReactionBar
          listId={data.list.id}
          shareUrl={`/list/${data.list.slug}`}
          initial={{
            likesCount: data.reactions?.likesCount ?? data.list.likesCount,
            savesCount: data.reactions?.savesCount ?? data.list.savesCount,
            liked: data.reactions?.liked,
            saved: data.reactions?.saved,
          }}
        />
      </header>

      <section className="space-y-3">
        <h2 className="h2">The seven books</h2>
        <ol className="space-y-3">
          {data.list.items.map((item: ListItem, index: number) => (
            <li key={item.bookId} className="flex items-start gap-3">
              <div className="mt-1 font-mono text-sm">{index + 1}.</div>
              <Link href={`/book/${item.book.slug}`} className="surface flex-1 p-4 transition hover:-translate-y-0.5">
                <div className="font-semibold">{item.book.canonicalTitle}</div>
                <div className="text-sm muted">{item.book.author.name}</div>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="h2">Follow the trail</h2>
        <TrailChips items={data.trails.map((trail: Trail) => ({ href: trail.href, label: trail.label, count: trail.count }))} />
      </section>

      <section className="space-y-3">
        <h2 className="h2">Overlap matches</h2>
        <div className="grid grid-cols-1 gap-4">
          {data.overlaps.length === 0 ? (
            <div className="text-sm muted">No overlap matches yet.</div>
          ) : (
            data.overlaps.map((overlap: Overlap) => (
              <div key={overlap.list.id} className="surface flex items-center justify-between gap-4 p-4">
                <div>
                  <Link href={`/list/${overlap.list.slug}`} className="font-semibold hover:underline">
                    {overlap.list.title}
                  </Link>
                  <div className="text-sm muted">@{overlap.list.owner.handle}</div>
                </div>
                <div className="rounded-full bg-[rgb(var(--color-accent))] px-3 py-1 text-xs">
                  {overlap.overlap}/7 shared
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <CommentsSection listId={data.list.id} listSlug={data.list.slug} initialComments={data.comments} />
    </div>
  );
}
