import Link from "next/link";

type Trail = {
  href: string;
  label: string;
  count?: number;
};

export function TrailChips({ items }: { items: Trail[] }) {
  if (items.length === 0) {
    return <div className="muted text-sm">No next trails yet.</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item: Trail) => (
        <Link
          key={`${item.href}:${item.label}`}
          href={item.href}
          className="inline-flex items-center gap-2 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-bg))]/80 px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:bg-[rgb(var(--color-accent))]"
        >
          <span>{item.label}</span>
          {typeof item.count === "number" ? (
            <span className="rounded-full bg-[rgb(var(--color-accent))] px-2 py-0.5 text-xs">{item.count}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
