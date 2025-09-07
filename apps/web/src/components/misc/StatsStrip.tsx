export function StatsStrip({ items = [] as { label: string; value: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((s) => (
        <div key={s.label} className="surface p-3 text-center">
          <div className="font-mono text-sm">{s.value}</div>
          <div className="muted text-xs">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

