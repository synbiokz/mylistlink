import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

type PreviewItem = {
  label: string;
  href: string;
};

export function ListCard({
  title = "Untitled List",
  owner = { name: "reader", avatarUrl: null as string | null, handle: "user" },
  href = "#",
  description = null,
  overlap,
  publishedLabel,
  previewItems = [],
  metrics,
}: {
  title?: string;
  owner?: { name: string; avatarUrl: string | null; handle: string };
  href?: string;
  description?: string | null;
  overlap?: number;
  publishedLabel?: string;
  previewItems?: PreviewItem[];
  metrics?: { likes: number; saves: number };
}) {
  return (
    <Card className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[rgb(var(--color-muted))]">
            {publishedLabel ?? "Published list"}
          </div>
          <Link href={href} className="line-clamp-2 text-lg font-semibold leading-6 hover:underline">
            {title}
          </Link>
          {description ? <p className="mt-2 line-clamp-2 text-sm muted">{description}</p> : null}
        </div>
        {typeof overlap === "number" ? (
          <div className="rounded-full bg-[rgb(var(--color-accent))] px-3 py-1 text-xs whitespace-nowrap">
            {overlap}/7 overlap
          </div>
        ) : null}
      </div>
      {previewItems.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {previewItems.slice(0, 3).map((item: PreviewItem) => (
            <Link
              key={`${item.href}:${item.label}`}
              href={item.href}
              className="rounded-full bg-[rgb(var(--color-accent))] px-3 py-1 text-xs transition hover:bg-[rgb(var(--color-border))]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
      <div className="mt-5 flex items-center justify-between gap-3 text-sm muted">
        <Link href={`/user/${owner.handle}`} className="flex min-w-0 items-center gap-2 hover:text-[rgb(var(--color-fg))]">
          <Avatar size={24} alt={owner.name} src={owner.avatarUrl} />
          <span className="truncate">@{owner.handle}</span>
        </Link>
        {metrics ? <span>{metrics.likes} likes / {metrics.saves} saves</span> : null}
      </div>
    </Card>
  );
}
