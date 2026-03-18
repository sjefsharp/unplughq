"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/server/trpc/client";
import { mockAlerts } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/severity-badge";
import { useFocusReturn } from "@/hooks/use-focus-management";
import { useSSE } from "@/hooks/use-sse";
import type { Alert } from "@/lib/schemas";

interface NotificationBellProps {
  alerts?: Alert[];
  className?: string;
}

export function NotificationBell({ alerts, className }: NotificationBellProps) {
  const { data: session } = trpc.auth.session.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { data: queriedAlerts } = trpc.monitor.alerts.list.useQuery(undefined, {
    enabled: alerts === undefined && Boolean(session?.user),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [open, setOpen] = useState(false);
  const [liveAlerts, setLiveAlerts] = useState<Alert[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const { saveTrigger, restoreFocus } = useFocusReturn();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useSSE({
    url: "/api/events",
    enabled: Boolean(session?.user),
    onMessage: (message) => {
      try {
        const parsed = JSON.parse(message.data);
        if (message.event === "alert.created") {
          setLiveAlerts((prev) => [parsed as Alert, ...prev.filter((alert) => alert.id !== parsed.id)]);
        }
        if (message.event === "alert.dismissed") {
          setLiveAlerts((prev) => prev.filter((alert) => alert.id !== parsed.alertId));
        }
      } catch {
        // Ignore malformed SSE payloads.
      }
    },
  });

  const baseAlerts = alerts ?? queriedAlerts ?? (session?.user ? [] : mockAlerts);
  const combinedAlerts = [...liveAlerts, ...baseAlerts].reduce<Alert[]>((accumulator, alert) => {
    if (!accumulator.some((item) => item.id === alert.id)) {
      accumulator.push(alert);
    }
    return accumulator;
  }, []);

  const count = combinedAlerts.length;
  const displayCount = count > 9 ? "9+" : count.toString();
  const recent = combinedAlerts.slice(0, 5);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        restoreFocus();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        restoreFocus();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, restoreFocus]);

  function formatRelativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  return (
    <div className={cn("relative", className)} ref={panelRef}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        aria-label={count > 0 ? `${count} unread alerts` : "Notifications"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          saveTrigger(triggerRef.current);
          setOpen(!open);
        }}
      >
        <Bell
          className={cn(
            "h-5 w-5",
            count > 0
              ? "text-[var(--color-text-base)]"
              : "text-[var(--color-text-muted)]",
          )}
          aria-hidden="true"
        />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-critical-base)] px-1 text-[10px] font-bold text-white">
            {displayCount}
          </span>
        )}
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-[var(--space-2)] w-[360px] max-h-[400px] overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border-base)] bg-[var(--color-bg-base)] shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] origin-top-right animate-[scale-in_var(--dur-fast)_var(--ease-spring)]"
        >
          {recent.length === 0 ? (
            <p className="p-[var(--space-4)] text-center text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
              No active alerts. Everything is running smoothly.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--color-border-subtle)]">
                {recent.map((alert) => (
                  <li
                    key={alert.id}
                    role="menuitem"
                    className="flex items-start gap-[var(--space-3)] px-[var(--space-4)] py-[var(--space-3)] hover:bg-[var(--color-bg-surface-hover)]"
                  >
                    <SeverityBadge severity={alert.severity} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)] truncate">
                        {alert.message}
                      </p>
                      <p className="text-[length:var(--text-xs-fs)] text-[var(--color-text-subtle)]">
                        {formatRelativeTime(alert.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-[var(--color-border-subtle)] p-[var(--space-3)] text-center">
                <Link
                  href="/alerts"
                  className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-primary-text)] hover:underline"
                  onClick={() => setOpen(false)}
                >
                  View all alerts
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
