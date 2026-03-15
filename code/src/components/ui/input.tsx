import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-[var(--input-height)] w-full rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-base-fs)] leading-[var(--text-base-lh)] text-[var(--color-text-base)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-subtle)] focus-visible:ring-offset-0 focus-visible:border-[var(--color-primary-base)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--color-critical-base)] aria-[invalid=true]:focus-visible:ring-[var(--color-critical-subtle)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
