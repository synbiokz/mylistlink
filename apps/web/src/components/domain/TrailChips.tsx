import { ItemChip } from "@/components/domain/ItemChip";

export function TrailChips() {
  return (
    <div className="flex flex-wrap gap-2">
      {["Next list A", "Next list B", "Next list C"].map((t) => (
        <ItemChip key={t} label={t} count={Math.floor(Math.random() * 5) + 1} />
      ))}
    </div>
  );
}

