export function Pagination() {
  return (
    <div className="flex items-center justify-center gap-2 text-sm">
      <button className="px-3 py-1 rounded-md border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-accent))]">Prev</button>
      <span className="muted">Page 1</span>
      <button className="px-3 py-1 rounded-md border border-[rgb(var(--color-border))] hover:bg-[rgb(var(--color-accent))]">Next</button>
    </div>
  );
}

