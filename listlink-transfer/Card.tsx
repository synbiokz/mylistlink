// Path: apps/web/src/components/ui/Card.tsx
// NOTE: New file. Standard “surface” with padding to ensure consistent card look.
import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return <div className="surface p-4">{children}</div>;
}
