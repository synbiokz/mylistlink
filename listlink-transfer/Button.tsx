// Path: apps/web/src/components/ui/Button.tsx
// NOTE: New file. Accessible, token-driven button with variants/sizes to unify CTA styling.
"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...rest },
  ref
) {
  const base =
    "inline-flex items-center justify-center rounded-[var(--radius-xl)] focus-ring transition-colors select-none";

  const v: Record<Variant, string> = {
    primary:
      "bg-[rgb(var(--color-brand-500))] text-white hover:bg-[rgb(var(--color-brand-600))] active:bg-[rgb(var(--color-brand-700))]",
    secondary:
      "bg-[rgb(var(--color-accent))] text-[rgb(var(--color-fg))] hover:opacity-90",
    ghost:
      "bg-transparent hover:bg-[rgb(var(--color-accent))]",
    destructive:
      "bg-[rgb(var(--color-danger))] text-white hover:opacity-90",
  };

  const s: Record<Size, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-5 text-base",
  };

  return (
    <button
      ref={ref}
      className={clsx(base, v[variant], s[size], className, loading && "opacity-70")}
      disabled={disabled || loading}
      {...rest}
    >
      {children}
    </button>
  );
});
