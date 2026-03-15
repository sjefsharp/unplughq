"use client";

import { cn } from "@/lib/utils";

type PulseRingStatus = "healthy" | "deploying" | "attention" | "offline";

interface PulseRingProps {
  status: PulseRingStatus;
  className?: string;
}

const statusConfig: Record<PulseRingStatus, { color: string; label: string; pulse: boolean; speed: string }> = {
  healthy: {
    color: "bg-[var(--color-success-base)]",
    label: "Healthy",
    pulse: true,
    speed: "animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]",
  },
  deploying: {
    color: "bg-[var(--color-primary-base)]",
    label: "Deploying",
    pulse: true,
    speed: "animate-[pulse-ring_1.3s_cubic-bezier(0.4,0,0.6,1)_infinite]",
  },
  attention: {
    color: "bg-[var(--color-warning-base)]",
    label: "Needs attention",
    pulse: true,
    speed: "animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]",
  },
  offline: {
    color: "bg-[var(--color-critical-base)]",
    label: "Offline",
    pulse: false,
    speed: "",
  },
};

export function PulseRing({ status, className }: PulseRingProps) {
  const config = statusConfig[status];

  return (
    <span className={cn("relative inline-flex h-3 w-3", className)} role="status">
      {config.pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-40 motion-safe:" + config.speed,
            config.color,
          )}
          aria-hidden="true"
        />
      )}
      <span
        className={cn("relative inline-flex h-3 w-3 rounded-full", config.color)}
        aria-hidden="true"
      />
      <span className="sr-only">Server status: {config.label}</span>
    </span>
  );
}
