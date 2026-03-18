import { cn } from "@/lib/utils";

interface MiniResourceBarProps {
  value: number; // 0-100
  label?: string;
  className?: string;
}

function getBarColor(value: number) {
  if (value >= 90) return "bg-[var(--color-critical-base)]";
  if (value >= 70) return "bg-[var(--color-warning-base)]";
  return "bg-[var(--color-success-base)]";
}

export function MiniResourceBar({ value, label, className }: MiniResourceBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <span className={cn("inline-flex items-center gap-[var(--space-2)]", className)}>
      <span className="relative h-1 w-[60px] overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
        <span
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all duration-[var(--dur-base)]", getBarColor(clamped))}
          style={{ width: `${clamped}%` }}
        />
      </span>
      {label && (
        <span className="text-[length:var(--text-xs-fs)] text-[var(--color-text-muted)]">
          {label}
        </span>
      )}
    </span>
  );
}
