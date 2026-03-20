"use client";

import { cn } from "@/lib/utils";
import type { AlertSeverity } from "@/lib/schemas";
import { CircleAlert, TriangleAlert, Info } from "lucide-react";

interface SeverityBadgeProps {
  severity: AlertSeverity;
  className?: string;
}

const severityConfig: Record<
  AlertSeverity,
  { bg: string; text: string; icon: React.ElementType; label: string }
> = {
  critical: {
    bg: "bg-[var(--color-critical-subtle)]",
    text: "text-[var(--color-critical-text)]",
    icon: CircleAlert,
    label: "Critical",
  },
  warning: {
    bg: "bg-[var(--color-warning-subtle)]",
    text: "text-[var(--color-warning-text)]",
    icon: TriangleAlert,
    label: "Warning",
  },
  info: {
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary-text)]",
    icon: Info,
    label: "Info",
  },
};

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--space-1)] rounded-full px-[var(--space-3)] h-6 text-[length:var(--text-xs-fs)] uppercase font-semibold tracking-[0.05em]",
        config.bg,
        config.text,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </span>
  );
}
