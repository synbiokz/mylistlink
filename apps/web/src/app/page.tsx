import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ListCard } from "@/components/domain/ListCard";
import { Avatar } from "@/components/ui/Avatar";
import {
  getHotOverlapCards,
  getNewestListPreviews,
  getSiteStats,
  getStarterGenres,
  getTopCurators,
  getTrendingBookCards,
  getTrendingListPreviews,
} from "@/data/discovery";

export const dynamic = "force-dynamic";

type TrendingList = Awaited<ReturnType<typeof getTrendingListPreviews>>[number];
type NewestList = Awaited<ReturnType<typeof getNewestListPreviews>>[number];
type TrendingBook = Awaited<ReturnType<typeof getTrendingBookCards>>[number];
type OverlapCard = Awaited<ReturnType<typeof getHotOverlapCards>>[number];
type StarterGenre = Awaited<ReturnType<typeof getStarterGenres>>[number];
type TopCurator = Awaited<ReturnType<typeof getTopCurators>>[number];

export default async function HomePage() {
  const [stats, trendingLists, newestLists, trendingBooks, overlaps, genres, curators] = await Promise.all([
    getSiteStats(),
    getTrendingListPreviews(6),
    getNewestListPreviews(6),
    getTrendingBookCards(6),
    getHotOverlapCards(4),
    getStarterGenres(6),
    getTopCurators(4),
  ]);

  return (
    <div className="space-y-12">
      <section className="section-grid items-stretch">
        <div className="surface panel-glow relative overflow-hidden p-8 sm:p-10">
          <div className="absolute right-[-40px] top-[-40px] h-40 w-40 rounded-full bg-[rgb(var(--color-brand-200))]/55 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-white/40 blur-3xl" />
          <div className="relative space-y-6">
            <div className="eyebrow">Seven books. Strong themes. Shared overlap.</div>
            <h1 className="display max-w-3xl">Create themed 7-book lists and discover readers through the books you share.</h1>
            <p className="max-w-2xl text-base leading-7 muted">
              ListLink is a taste graph for expressive book lists that become more interesting when the same novel shows up in wildly different moods, themes, and readers.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/create">
                <Button variant="primary" size="lg">Build your 7</Button>
              </Link>
              <Link href="/discover">
                <Button variant="secondary" size="lg">Explore overlaps</Button>
              </Link>
            </div>
            <div className="grid gap-3 pt-3 sm:grid-cols-3">
              <StatBox value={stats.lists} label="published lists" />
              <StatBox value={stats.users} label="readers" />
              <StatBox value={stats.books} label="canonical books" />
            </div>
          </div>
        </div>

        <Card className="panel-glow flex h-full flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="eyebrow">Active curators</div>
              <h2 className="mt-2 text-2xl font-semibold">Readers shaping the graph</h2>
            </div>
            <div className="space-y-3">
              {curators.map((curator: TopCurator) => (
                <Link
                  key={curator.id}
                  href={`/user/${curator.handle}`}
                  className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[rgb(var(--color-border))] bg-white/45 p-3 transition hover:-translate-y-0.5"
                >
                  <Avatar alt={curator.name ?? curator.handle} src={curator.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{curator.name ?? curator.handle}</div>
                    <div className="text-sm muted">@{curator.handle}</div>
                    <div className="mt-1 text-xs muted">
                      {curator._count.lists} published lists
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <Link href="/discover" className="mt-6 text-sm font-medium hover:underline">
            See more discovery surfaces
          </Link>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Trending lists</div>
            <h2 className="h2 mt-2">Strong themes attracting attention right now</h2>
          </div>
          <Link href="/lists" className="text-sm font-medium hover:underline">All lists</Link>
        </div>
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
              publishedLabel={list.publishedAt ? new Date(list.publishedAt).toLocaleDateString() : "Published"}
              metrics={{ likes: list.likesCount, saves: list.savesCount }}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="eyebrow">Trending books</div>
          <h2 className="h2 mt-2">Books showing up in the most lists</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {trendingBooks.map((book: TrendingBook) => (
            <Card key={book.id} className="panel-glow">
              <div className="eyebrow">{book.genrePrimary ?? "Book"}</div>
              <div className="mt-2 text-lg font-semibold">
                <Link href={`/book/${book.slug}`} className="hover:underline">
                  {book.title}
                </Link>
              </div>
              <div className="mt-2 text-sm muted">{book.authorName}{book.publicationYear ? ` / ${book.publicationYear}` : ""}</div>
              <div className="mt-5 text-xs uppercase tracking-[0.24em] muted">Appears in {book.count} published lists</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="eyebrow">Hot overlaps</div>
          <h2 className="h2 mt-2">Where different vibes collide</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {overlaps.map((row: OverlapCard, index: number) => (
            <Card key={`${row.a.id}-${row.b.id}-${index}`} className="panel-glow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-3">
                  <div>
                    <div className="text-sm muted">Shared taste corridor</div>
                    <div className="truncate font-semibold">
                      <Link href={`/list/${row.a.slug}`} className="hover:underline">{row.a.title}</Link>
                    </div>
                    <div className="truncate text-sm">
                      with <Link href={`/list/${row.b.slug}`} className="hover:underline">{row.b.title}</Link>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm muted">
                    <span>@{row.a.owner.handle}</span>
                    <span>@{row.b.owner.handle}</span>
                  </div>
                </div>
                <div className="rounded-full bg-[rgb(var(--color-brand-500))] px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap">
                  {row.overlap}/7 shared
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="eyebrow">Starter genres</div>
          <h2 className="h2 mt-2">Easy ways into the graph</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {genres.map((genre: StarterGenre) => (
            <div key={genre.genre} className="rounded-full border border-[rgb(var(--color-border))] bg-white/60 px-4 py-2 text-sm">
              {genre.genre} <span className="muted">({genre.count})</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="eyebrow">Newest lists</div>
          <h2 className="h2 mt-2">Recently published book lists</h2>
        </div>
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
              publishedLabel={list.publishedAt ? new Date(list.publishedAt).toLocaleDateString() : "Published"}
              metrics={{ likes: list.likesCount, saves: list.savesCount }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[rgb(var(--color-border))] bg-white/50 p-4">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm muted">{label}</div>
    </div>
  );
}
