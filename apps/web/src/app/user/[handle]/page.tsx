import { UserBar } from "@/components/domain/UserBar";
import { ListCard } from "@/components/domain/ListCard";
import { getUserByHandle } from "@/data/users";
import { listByUser } from "@/data/lists";
import { notFound } from "next/navigation";

export default async function UserPage({ params }: { params: { handle: string } }) {
  const user = await getUserByHandle(params.handle);
  if (!user) return notFound();
  const lists = await listByUser(user.id, 12);
  return (
    <div className="space-y-8">
      <UserBar name={user.name ?? params.handle} handle={params.handle} avatarUrl={user.avatarUrl ?? null} />

      <section className="space-y-3">
        <div className="flex items-center gap-4 text-sm">
          <button className="px-3 py-1 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-accent))]">Published</button>
          <button className="px-3 py-1 rounded-md border border-[rgb(var(--color-border))]">Drafts</button>
        </div>
        {lists.length === 0 ? (
          <div className="muted text-sm">No published lists yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {lists.map((l) => (
              <ListCard key={l.id} title={l.title} href={`/list/${l.slug}`} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
