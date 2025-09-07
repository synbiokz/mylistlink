import { ListCard } from "@/components/domain/ListCard";

export function OverlapPanel() {
  return (
    <section className="space-y-3">
      <h3 className="h2">Overlaps</h3>
      <div className="grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, i) => (
          <ListCard key={i} overlap={Math.max(1, 3 - i)} />
        ))}
      </div>
      <div className="text-sm muted">More overlaps coming soon.</div>
    </section>
  );
}

