export function ReactionBar() {
  return (
    <div className="flex items-center gap-3 text-sm">
      <button className="px-2 py-1 rounded-md hover:bg-[rgb(var(--color-accent))]">❤ Like</button>
      <button className="px-2 py-1 rounded-md hover:bg-[rgb(var(--color-accent))]">★ Save</button>
      <button className="px-2 py-1 rounded-md hover:bg-[rgb(var(--color-accent))]">↗ Share</button>
    </div>
  );
}

