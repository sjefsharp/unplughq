import { cn } from "@/lib/utils";
import { PulseRing } from "@/components/pulse-ring";

type StatusType = "healthy" | "deploying" | "attention" | "offline";

interface StatusIndicatorProps {
  status: StatusType;
  className?: string;
}

const statusLabels: Record<StatusType, string> = {
  healthy: "Healthy",
  deploying: "Deploying",
  attention: "Needs attention",
  offline: "Offline",
};

const statusTextColors: Record<StatusType, string> = {
  healthy: "text-[var(--color-success-text)]",
  deploying: "text-[var(--color-primary-text)]",
  attention: "text-[var(--color-warning-text)]",
  offline: "text-[var(--color-critical-text)]",
};

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
  return (
    <span className={cn("inline-flex items-center gap-[var(--space-2)]", className)}>
      <PulseRing status={status} />
      <span className={cn("text-[length:var(--text-sm-fs)] font-medium", statusTextColors[status])}>
        {statusLabels[status]}
      </span>
    </span>
  );
}
