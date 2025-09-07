// Path: apps/web/src/components/ui/Input.tsx
// NOTE: New file. Input styled with tokens + focus ring; used by search and forms.
"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={clsx(
          "w-full h-10 rounded-[var(--radius-md)] bg-white/80 dark:bg-black/20",
          "border border-[rgb(var(--color-border))] px-3 text-sm",
          "focus-ring",
          className
        )}
        {...rest}
      />
    );
  }
);
