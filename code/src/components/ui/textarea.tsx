import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-bg-base)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-base-fs)] leading-[var(--text-base-lh)] text-[var(--color-text-base)] font-[family-name:var(--font-mono)] placeholder:text-[var(--color-text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-subtle)] focus-visible:ring-offset-0 focus-visible:border-[var(--color-primary-base)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--color-critical-base)]",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
