"use client";

import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/lib/schemas";

interface AppStatusBadgeProps {
  status: DeploymentStatus;
  className?: string;
}

const badgeConfig: Record<
  string,
  { bg: string; text: string; label: string; pulse: boolean }
> = {
  running: {
    bg: "bg-[var(--color-success-subtle)]",
    text: "text-[var(--color-success-text)]",
    label: "Running",
    pulse: true,
  },
  stopped: {
    bg: "bg-[var(--color-bg-surface)]",
    text: "text-[var(--color-text-subtle)]",
    label: "Stopped",
    pulse: false,
  },
  unhealthy: {
    bg: "bg-[var(--color-critical-subtle)]",
    text: "text-[var(--color-critical-text)]",
    label: "Unhealthy",
    pulse: false,
  },
  failed: {
    bg: "bg-[var(--color-critical-subtle)]",
    text: "text-[var(--color-critical-text)]",
    label: "Not responding",
    pulse: false,
  },
  pending: {
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary-text)]",
    label: "Updating",
    pulse: true,
  },
  pulling: {
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary-text)]",
    label: "Updating",
    pulse: true,
  },
  configuring: {
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary-text)]",
    label: "Updating",
    pulse: true,
  },
  "provisioning-ssl": {
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary-text)]",
    label: "Updating",
    pulse: true,
  },
  starting: {
    bg: "bg-[var(--color-primary-subtle)]",
    text: "text-[var(--color-primary-text)]",
    label: "Updating",
    pulse: true,
  },
  removing: {
    bg: "bg-[var(--color-warning-subtle)]",
    text: "text-[var(--color-warning-text)]",
    label: "Removing",
    pulse: false,
  },
};

export function AppStatusBadge({ status, className }: AppStatusBadgeProps) {
  const config = badgeConfig[status] ?? badgeConfig.stopped;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--space-1)] rounded-full px-[var(--space-3)] h-6 text-[length:var(--text-xs-fs)] uppercase font-semibold tracking-[0.05em]",
        config.bg,
        config.text,
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-flex h-2 w-2 rounded-full",
          config.pulse
            ? "motion-safe:animate-[pulse-ring_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
            : "",
        )}
        aria-hidden="true"
      >
        <span
          className={cn("inline-flex h-2 w-2 rounded-full", {
            "bg-[var(--color-success-base)]": status === "running",
            "bg-[var(--color-text-subtle)]": status === "stopped",
            "bg-[var(--color-critical-base)]":
              status === "unhealthy" || status === "failed",
            "bg-[var(--color-primary-base)]":
              status === "pending" ||
              status === "pulling" ||
              status === "configuring" ||
              status === "provisioning-ssl" ||
              status === "starting",
            "bg-[var(--color-warning-base)]": status === "removing",
          })}
        />
      </span>
      {config.label}
    </span>
  );
}
