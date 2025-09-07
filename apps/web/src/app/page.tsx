import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import prisma from "@/lib/prisma";
import { listRecentPublished } from "@/data/lists";
import { ListCard } from "@/components/domain/ListCard";

export default async function HomePage() {
  const recent = await listRecentPublished(6);
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="h-24 skel" />
              <div className="mt-3 text-sm muted">Loading item…</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h2">Hot Overlaps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <div className="h-24 skel" />
              <div className="mt-3 text-sm muted">Loading overlaps…</div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="h2">New Today</h2>
        {recent.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <div className="h-24 skel" />
                <div className="mt-3 text-sm muted">No lists yet</div>
              </Card>
            ))}
          </div>
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
