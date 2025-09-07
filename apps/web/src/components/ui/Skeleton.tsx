// Path: apps/web/src/components/ui/Skeleton.tsx
// NOTE: New file. Skeleton blocks for perceived performance in loading states.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skel ${className}`} />;
}

