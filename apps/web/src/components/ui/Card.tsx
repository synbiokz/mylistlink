// Path: apps/web/src/components/ui/Card.tsx
// NOTE: New file. Standard surface with padding to ensure consistent card look.
import clsx from "clsx";
import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("surface p-5", className)}>{children}</div>;
}
