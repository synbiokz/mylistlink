import { Avatar } from "@/components/ui/Avatar";

export function UserBar({ name = "Someone", handle = "user", avatarUrl = null as string | null }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar alt={name} src={avatarUrl} />
      <div className="text-sm">
        <div className="font-medium">{name}</div>
        <div className="muted">@{handle}</div>
      </div>
      <div className="ml-auto">
        <button className="px-3 py-1 rounded-md border border-[rgb(var(--color-border))] text-sm hover:bg-[rgb(var(--color-accent))]">Follow</button>
      </div>
    </div>
  );
}

