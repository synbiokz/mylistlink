import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

export function ListCard({
  title = "Untitled List",
  owner = { name: "someone", avatarUrl: null as string | null, handle: "user" },
  href = "#",
  overlap = 0,
}: {
  title?: string;
  owner?: { name: string; avatarUrl: string | null; handle: string };
  href?: string;
  overlap?: number;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={href} className="font-semibold hover:underline line-clamp-2">
            {title}
          </Link>
          <div className="mt-2 space-y-1 text-sm">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 skel" />
            ))}
          </div>
        </div>
        <div className="text-xs bg-[rgb(var(--color-accent))] px-2 py-1 rounded-md whitespace-nowrap">
          {overlap}/7
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm muted">
        <Avatar size={20} alt={owner.name} src={owner.avatarUrl} />
        <span className="truncate">@{owner.handle}</span>
      </div>
    </Card>
  );
}

