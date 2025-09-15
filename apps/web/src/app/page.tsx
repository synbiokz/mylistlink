import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listRecentPublished } from "@/data/lists";
import { ListCard } from "@/components/domain/ListCard";
import { trendingItems } from "@/data/items";
import { hotOverlaps } from "@/data/overlaps";

export default async function HomePage() {
  async function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
    return await Promise.race<T>([
      p,
      new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
    ]);
  }
  const [recent, trending] = await Promise.all([
    listRecentPublished(6),
    trendingItems(6),
  ]);
  const overlaps = await withTimeout(hotOverlaps(12, 6), 5000, []);
  return (
    <div className="space-y-10">
      <section className="text-center space-y-5">
        <h1 className="display">Build lists of 7. Discover via overlaps.</h1>
        <p className="max-w-2xl mx-auto text-base leading-7 muted">
          Create themed lists, explore shared items across the community, and
          follow trails that connect ideas you care about.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/create">
            <Button variant="primary" size="lg">Start a list</Button>
          </Link>
          <Link href="/discover">
            <Button variant="secondary" size="lg">Explore</Button>
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h2">Trending Items</h2>
        {trending.length === 0 ? (
          <div className="muted text-sm">No data yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {trending.map((it) => (
              <Card key={it.id}>
                <div className="font-semibold">
                  <Link href={`/work/${it.id}`} className="hover:underline">
                    {it.title ?? "Untitled"}
                  </Link>
                </div>
                <div className="mt-2 text-xs muted">Appears in {it.count} lists</div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="h2">Hot Overlaps</h2>
        {overlaps.length === 0 ? (
          <div className="muted text-sm">No overlaps yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {overlaps.map((o, i) => (
              <Card key={`${o.a.id}-${o.b.id}-${i}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      <Link href={`/list/${o.a.slug}`} className="hover:underline">{o.a.title}</Link>
                    </div>
                    <div className="text-sm truncate">
                      ↔ <Link href={`/list/${o.b.slug}`} className="hover:underline">{o.b.title}</Link>
                    </div>
                  </div>
                  <div className="text-xs bg-[rgb(var(--color-accent))] px-2 py-1 rounded-md whitespace-nowrap">{o.overlap}/7</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="h2">New Today</h2>
        {recent.length === 0 ? (
          <div className="muted text-sm">No lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {recent.map((l) => (
              <ListCard key={l.id} title={l.title} href={`/list/${l.slug}`} overlap={0} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
