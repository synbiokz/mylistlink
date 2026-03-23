import { Card } from "@/components/ui/Card";
import { ListCard } from "@/components/domain/ListCard";
import { getHotOverlapCards, getNewestListPreviews, getStarterGenres, getTrendingBookCards, getTrendingListPreviews } from "@/data/discovery";

export const dynamic = "force-dynamic";

type TrendingList = Awaited<ReturnType<typeof getTrendingListPreviews>>[number];
type NewestList = Awaited<ReturnType<typeof getNewestListPreviews>>[number];
type TrendingBook = Awaited<ReturnType<typeof getTrendingBookCards>>[number];
type OverlapCard = Awaited<ReturnType<typeof getHotOverlapCards>>[number];
type StarterGenre = Awaited<ReturnType<typeof getStarterGenres>>[number];

export default async function DiscoverPage() {
  const [trendingLists, newestLists, trendingBooks, overlaps, genres] = await Promise.all([
    getTrendingListPreviews(9),
    getNewestListPreviews(9),
    getTrendingBookCards(8),
    getHotOverlapCards(6),
    getStarterGenres(8),
  ]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="h1">Discover</h1>
        <p className="muted mt-2">Start with strong list themes, move through shared books, and keep clicking.</p>
      </div>

      <section className="space-y-4">
        <h2 className="h2">Trending lists</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trendingLists.map((list: TrendingList) => (
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
      </section>

      <section className="space-y-4">
        <h2 className="h2">Books with the strongest list gravity</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {trendingBooks.map((book: TrendingBook) => (
            <Card key={book.id}>
              <div className="text-sm muted">{book.genrePrimary ?? "Book"}</div>
              <div className="mt-2 font-semibold">{book.title}</div>
              <div className="text-sm muted">{book.authorName}</div>
              <div className="mt-3 text-xs muted">{book.count} list appearances</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h2">High-overlap matches</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {overlaps.map((row: OverlapCard, index: number) => (
            <Card key={`${row.a.id}-${row.b.id}-${index}`}>
              <div className="font-semibold">{row.a.title}</div>
              <div className="text-sm muted">with {row.b.title}</div>
              <div className="mt-3 text-xs muted">{row.overlap}/7 shared books</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h2">Starter genres</h2>
        <div className="flex flex-wrap gap-3">
          {genres.map((genre: StarterGenre) => (
            <div key={genre.genre} className="rounded-full border border-[rgb(var(--color-border))] bg-white/60 px-4 py-2 text-sm">
              {genre.genre} <span className="muted">({genre.count})</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h2">Newest lists</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {newestLists.map((list: NewestList) => (
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
      </section>
    </div>
  );
}
