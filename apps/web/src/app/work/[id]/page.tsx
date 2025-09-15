import prisma from "@/lib/prisma";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

async function getWork(id: number) {
  const work = await prisma.work.findUnique({ where: { id } } as any);
  return work;
}

async function listsForWork(workId: number) {
  try {
    const links = await prisma.listWork.findMany({
      where: { workId, list: { status: "PUBLISHED" } } as any,
      include: { list: { include: { owner: true } } } as any,
      orderBy: { list: { publishedAt: "desc" } } as any,
      take: 24,
    } as any);
    return links.map((lw: any) => lw.list);
  } catch {
    return [];
  }
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return <div>Invalid work id</div>;
  const work = await getWork(id).catch(() => null);
  if (!work) return <div>Work not found.</div>;
  const lists = await listsForWork(id);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="h1">{(work as any).title || "Untitled"}</h1>
        <div className="muted">{(work as any).kind}{(work as any).year ? ` · ${(work as any).year}` : ""}{(work as any).creator ? ` · ${(work as any).creator}` : ""}</div>
      </header>
      <section className="space-y-3">
        <h2 className="h2">Appears in</h2>
        {lists.length === 0 ? (
          <div className="muted text-sm">No published lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {lists.map((l: any) => (
              <Card key={l.id}>
                <div className="font-semibold">
                  <Link href={`/list/${l.slug}`} className="hover:underline">{l.title}</Link>
                </div>
                <div className="mt-2 text-xs muted">by {l.owner?.handle ? (<Link href={`/user/${l.owner.handle}`}>@{l.owner.handle}</Link>) : ("unknown")}</div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
