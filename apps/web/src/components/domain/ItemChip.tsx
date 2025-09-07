export function ItemChip({ label, count = 0 }: { label: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[rgb(var(--color-border))] text-sm">
      <span className="truncate max-w-[16ch]">{label}</span>
      <span className="text-xs muted">{count}</span>
    </span>
  );
}

