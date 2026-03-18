"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Clock, Server, AppWindow } from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { useSSE } from "@/hooks/use-sse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/severity-badge";
import { cn } from "@/lib/utils";
import type { Alert } from "@/lib/schemas";

export default function AlertsPage() {
  const { data: alertList, isLoading } = trpc.monitor.alerts.list.useQuery();
  const dismissMutation = trpc.monitor.alerts.dismiss.useMutation();

  const [sseAlerts, setSSEAlerts] = useState<Alert[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [newAlertAnnouncement, setNewAlertAnnouncement] = useState("");
  const [actionAnnouncement, setActionAnnouncement] = useState("");
  const alertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
      if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    };
  }, []);

  const handleSSEMessage = useCallback(
    (msg: { event: string; data: string }) => {
      try {
        const parsed = JSON.parse(msg.data);
        if (msg.event === "alert.created" && parsed.severity && parsed.type && parsed.id) {
          setSSEAlerts((prev) => [parsed, ...prev]);
          setNewAlertAnnouncement(`New ${parsed.severity} alert: ${parsed.message || parsed.type}`);
          if (alertTimerRef.current) clearTimeout(alertTimerRef.current);
          alertTimerRef.current = setTimeout(() => setNewAlertAnnouncement(""), 5000);
        } else if (msg.event === "alert.dismissed" && parsed.alertId) {
          setSSEAlerts((prev) => prev.filter((a) => a.id !== parsed.alertId));
        }
      } catch {
        // Ignore parse errors
      }
    },
    [],
  );

  useSSE({ url: "/api/events", onMessage: handleSSEMessage });

  const allAlerts = [...sseAlerts, ...(alertList ?? [])].reduce<Alert[]>(
    (acc, a) => {
      if (!acc.find((x) => x.id === a.id)) acc.push(a);
      return acc;
    },
    [],
  );

  const sortedAlerts = allAlerts.sort((a, b) => {
    const sevOrder = { critical: 0, warning: 1, info: 2 };
    const sevDiff = sevOrder[a.severity] - sevOrder[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeAlerts = sortedAlerts.filter((alert) => !dismissedIds.includes(alert.id));
  const recentAlerts = sortedAlerts.filter((alert) => dismissedIds.includes(alert.id));

  const acknowledgeAlert = (alertId: string) => {
    setAcknowledgedIds((previous) => (previous.includes(alertId) ? previous : [...previous, alertId]));
    setActionAnnouncement("Alert acknowledged. Repeat notifications silenced.");
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setActionAnnouncement(""), 5000);
  };

  const dismissAlert = (alertId: string) => {
    setDismissedIds((previous) => (previous.includes(alertId) ? previous : [...previous, alertId]));
    dismissMutation.mutate({ alertId });
    setActionAnnouncement("Alert dismissed. It will return if the condition reoccurs.");
    if (actionTimerRef.current) clearTimeout(actionTimerRef.current);
    actionTimerRef.current = setTimeout(() => setActionAnnouncement(""), 5000);
  };

  if (isLoading) {
    return (
      <div className="space-y-[var(--space-6)]">
        <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]">
          Alerts
        </h1>
        <div className="space-y-[var(--space-3)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-surface)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      {/* Visually-hidden aria-live regions for screen reader announcements (AB#310) */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {newAlertAnnouncement}
      </div>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {actionAnnouncement}
      </div>

      <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]">
        Alerts
      </h1>

      {activeAlerts.length === 0 ? (
        <Card>
          <CardContent className="py-[var(--space-8)] text-center">
            <p className="text-[var(--color-text-subtle)]">
              No active alerts. Everything is running smoothly.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-[var(--space-2)]" role="list" aria-label="Active alerts">
          {activeAlerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            const alertTime = new Date(alert.createdAt).toLocaleString();
            const isAcknowledged = Boolean(alert.acknowledgedAt) || acknowledgedIds.includes(alert.id);

            return (
              <div key={alert.id} role="listitem">
                {/* Collapsed row */}
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-4)] py-[var(--space-3)] text-left transition-colors",
                    "bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-surface-hover)]",
                    isExpanded && "rounded-b-none",
                  )}
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`alert-detail-${alert.id}`}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
                  )}
                  <SeverityBadge severity={alert.severity} />
                  <span className="flex-1 text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">
                    {alert.message}
                  </span>
                  <span className="flex items-center gap-[var(--space-1)] text-[length:var(--text-xs-fs)] text-[var(--color-text-muted)]">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {alertTime}
                  </span>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div
                    id={`alert-detail-${alert.id}`}
                    className="rounded-b-[var(--radius-md)] border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-[var(--space-6)] py-[var(--space-4)]"
                  >
                    <div className="space-y-[var(--space-3)]">
                      {/* Metadata */}
                      <div className="flex flex-wrap gap-[var(--space-4)] text-[length:var(--text-sm-fs)]">
                        <span className="flex items-center gap-[var(--space-1)] text-[var(--color-text-subtle)]">
                          <Server className="h-3.5 w-3.5" aria-hidden="true" />
                          Server: {alert.serverId.slice(0, 8)}…
                        </span>
                        {alert.appId && (
                          <span className="flex items-center gap-[var(--space-1)] text-[var(--color-text-subtle)]">
                            <AppWindow className="h-3.5 w-3.5" aria-hidden="true" />
                            App: {alert.appId.slice(0, 8)}…
                          </span>
                        )}
                        <span className="text-[var(--color-text-muted)]">
                          Type: {alert.type}
                        </span>
                        <span className="text-[var(--color-text-muted)]">
                          Detected at {alertTime}
                        </span>
                      </div>

                      {/* Acknowledged indicator */}
                      {isAcknowledged && (
                        <p className="text-[length:var(--text-xs-fs)] text-[var(--color-text-muted)]">
                          Acknowledged. This alert won&apos;t send repeat notifications.
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-[var(--space-3)]">
                        {/* Remediation link for actionable types */}
                        {["cpu-critical", "ram-critical", "disk-critical", "app-unavailable"].includes(alert.type) && (
                          <Button size="sm" asChild>
                            <Link href={`/alerts/${alert.id}/remediate`}>
                              View remediation steps
                            </Link>
                          </Button>
                        )}

                        {!isAcknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                            title="Acknowledged. This alert won't send repeat notifications."
                          >
                            Acknowledge
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                          disabled={dismissMutation.isPending}
                          title="Dismissed. Returns if the condition reoccurs."
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {recentAlerts.length > 0 && (
        <section className="space-y-[var(--space-2)]" aria-label="Recent alerts">
          <h2 className="text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)]">
            Recent
          </h2>
          {recentAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-[var(--space-4)] py-[var(--space-3)] opacity-70"
            >
              <SeverityBadge severity={alert.severity} />
              <span className="flex-1 text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
                {alert.message}
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
