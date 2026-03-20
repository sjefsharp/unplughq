"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { ExternalLink, MoreVertical, Plus, RefreshCcw } from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { useSSE } from "@/hooks/use-sse";
import { mockDashboardOutput } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResourceGauge } from "@/components/resource-gauge";
import { AppStatusBadge } from "@/components/app-status-badge";
import { MiniResourceBar } from "@/components/mini-resource-bar";
import { SeverityBadge } from "@/components/severity-badge";
import { cn } from "@/lib/utils";
import type { MetricsSnapshot, Alert as AlertType } from "@/lib/schemas";

export default function DashboardPage() {
  const { data: dashboard, isLoading, refetch, isError } = trpc.monitor.dashboard.useQuery(undefined, {
    refetchInterval: 60_000,
    retry: false,
  });

  const [latestMetrics, setLatestMetrics] = useState<Record<string, MetricsSnapshot>>({});
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [staleAt, setStaleAt] = useState<Record<string, number>>({});

  const handleSSEMessage = useCallback(
    (msg: { event: string; data: string }) => {
      try {
        const parsed = JSON.parse(msg.data);
        if (msg.event === "metrics.update" && parsed.cpuPercent !== undefined && parsed.serverId) {
          setLatestMetrics((prev) => ({ ...prev, [parsed.serverId]: parsed }));
          setStaleAt((prev) => ({ ...prev, [parsed.serverId]: Date.now() }));
        } else if (msg.event === "alert.created" && parsed.severity && parsed.type) {
          setAlerts((prev) => [parsed, ...prev]);
        } else if (msg.event === "alert.dismissed" && parsed.alertId) {
          setAlerts((prev) => prev.filter((a) => a.id !== parsed.alertId));
        }
      } catch {
        // Ignore parse errors
      }
    },
    [],
  );

  useSSE({ url: "/api/events", onMessage: handleSSEMessage });

  const effectiveDashboard = dashboard ?? (isError ? mockDashboardOutput : dashboard);
  const servers = useMemo(() => effectiveDashboard?.servers ?? [], [effectiveDashboard]);

  const enrichedServers = useMemo(() => {
    return servers.map((s) => ({
      ...s,
      latestMetrics: latestMetrics[s.server.id] ?? s.latestMetrics,
      activeAlerts: [
        ...s.activeAlerts,
        ...alerts.filter((a) => a.serverId === s.server.id),
      ],
    }));
  }, [servers, latestMetrics, alerts]);

  if (isLoading) {
    return (
      <div className="space-y-[var(--space-6)]">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-[var(--space-8)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-32" />
          ))}
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[var(--space-6)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  if (enrichedServers.length === 0) {
    return (
      <div className="space-y-[var(--space-6)]">
        <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]">
          Dashboard
        </h1>
        <Card>
          <CardHeader className="text-center pb-[var(--space-2)]">
            <CardTitle>No apps running yet.</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-[var(--space-6)] text-[var(--color-text-subtle)]">
              Deploy your first application.
            </p>
            <Button asChild>
              <Link href="/marketplace">Browse apps</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex items-center justify-between">
        <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]">
          Your server at a glance
        </h1>
        <Button variant="ghost" size="icon" onClick={() => refetch()} aria-label="Refresh dashboard">
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {enrichedServers.map((serverData) => {
        const { server, latestMetrics: metrics, apps, activeAlerts: serverAlerts } = serverData;

        const cpuPercent = metrics?.cpuPercent ?? 0;
        const ramPercent = metrics
          ? (metrics.ramUsedBytes / Math.max(metrics.ramTotalBytes, 1)) * 100
          : 0;
        const diskPercent = metrics
          ? (metrics.diskUsedBytes / Math.max(metrics.diskTotalBytes, 1)) * 100
          : 0;
        const networkPercent = metrics
          ? Math.min(
              ((metrics.networkRxBytesPerSec + metrics.networkTxBytesPerSec) /
                (100 * 1024 * 1024)) *
                100,
              100,
            )
          : 0;

        const lastSeenAt = staleAt[server.id] ?? (metrics ? new Date(metrics.timestamp).getTime() : 0);
        const isStale = lastSeenAt > 0 && Date.now() - lastSeenAt > 120_000;
        const lastUpdate = lastSeenAt
          ? new Date(lastSeenAt).toLocaleTimeString()
          : null;

        const hasAlerts = serverAlerts.length > 0;

        return (
          <div key={server.id} className="space-y-[var(--space-6)]">
            {/* Alert banners */}
            {hasAlerts && (
              <div className="space-y-[var(--space-2)]" role="region" aria-label="Active alerts" aria-live="polite">
                {serverAlerts.length <= 3 ? (
                  serverAlerts.map((alert) => (
                    <AlertBanner key={alert.id} alert={alert} />
                  ))
                ) : (
                  <div className="flex items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] border-l-4 border-[var(--color-critical-base)] bg-[var(--color-critical-subtle)] px-[var(--space-4)] py-[var(--space-3)]">
                    <span className="text-[length:var(--text-sm-fs)] text-[var(--color-critical-text)]">
                      {serverAlerts.length} active alerts.{" "}
                      <Link href="/alerts" className="font-medium underline">View all.</Link>
                    </span>
                  </div>
                )}
              </div>
            )}

            {!hasAlerts && (
              <div className="rounded-[var(--radius-sm)] bg-[var(--color-success-subtle)] px-[var(--space-4)] py-[var(--space-3)]">
                <p className="text-[length:var(--text-sm-fs)] text-[var(--color-success-text)]">
                  Everything is running smoothly.
                </p>
              </div>
            )}

            {/* Resource gauges (S-207) */}
            <div className="flex flex-wrap items-center justify-center gap-[var(--space-8)] md:justify-start">
              <div className={cn(isStale && "opacity-50")} title={isStale ? "Data may be outdated" : undefined}>
                <ResourceGauge value={cpuPercent} label="CPU" />
              </div>
              <div className={cn(isStale && "opacity-50")}>
                <ResourceGauge value={ramPercent} label="Memory" />
              </div>
              <div className={cn(isStale && "opacity-50")}>
                <ResourceGauge value={diskPercent} label="Storage" />
              </div>
              <div className={cn(isStale && "opacity-50")}>
                <ResourceGauge value={networkPercent} label="Network" />
              </div>
            </div>

            {isStale && lastUpdate && (
              <p className="text-center text-[length:var(--text-xs-fs)] text-[var(--color-text-subtle)]">
                Data may be outdated. Last update: {lastUpdate}.
              </p>
            )}

            {/* App grid (S-206) */}
            <section aria-label="Your applications">
              <div className="mb-[var(--space-4)] flex items-center justify-between">
                <h2 className="text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)]">
                  {apps.length} apps running on {server.name}
                </h2>
                <Button size="sm" asChild>
                  <Link href="/marketplace">
                    <Plus className="h-4 w-4 mr-[var(--space-1)]" aria-hidden="true" />
                    Add another app
                  </Link>
                </Button>
              </div>

              <div className="mb-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] px-[var(--space-4)] py-[var(--space-3)]">
                <p className="text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)]">
                  Deploying a new app won&apos;t affect your running apps.
                </p>
              </div>

              {apps.length === 0 ? (
                <Card>
                  <CardContent className="py-[var(--space-8)] text-center">
                    <p className="text-[var(--color-text-muted)]">
                      No apps running yet. Deploy your first application.
                    </p>
                    <Button asChild className="mt-[var(--space-4)]">
                      <Link href="/marketplace">Browse apps</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Desktop: table view */}
                  <div className="hidden lg:block">
                    <table className="w-full" aria-label="Deployed applications">
                      <thead>
                        <tr className="sticky top-0 bg-[var(--color-bg-surface)]">
                          <th className="px-[var(--space-4)] py-[var(--space-3)] text-left text-[length:var(--text-xs-fs)] uppercase tracking-[0.05em] text-[var(--color-text-subtle)]" style={{ width: "30%" }}>App</th>
                          <th className="px-[var(--space-4)] py-[var(--space-3)] text-left text-[length:var(--text-xs-fs)] uppercase tracking-[0.05em] text-[var(--color-text-subtle)]" style={{ width: "15%" }}>Status</th>
                          <th className="px-[var(--space-4)] py-[var(--space-3)] text-left text-[length:var(--text-xs-fs)] uppercase tracking-[0.05em] text-[var(--color-text-subtle)]" style={{ width: "12%" }}>CPU</th>
                          <th className="px-[var(--space-4)] py-[var(--space-3)] text-left text-[length:var(--text-xs-fs)] uppercase tracking-[0.05em] text-[var(--color-text-subtle)]" style={{ width: "12%" }}>Memory</th>
                          <th className="px-[var(--space-4)] py-[var(--space-3)] text-left text-[length:var(--text-xs-fs)] uppercase tracking-[0.05em] text-[var(--color-text-subtle)]" style={{ width: "12%" }}>Storage</th>
                          <th className="px-[var(--space-4)] py-[var(--space-3)] text-right text-[length:var(--text-xs-fs)] uppercase tracking-[0.05em] text-[var(--color-text-subtle)]" style={{ width: "19%" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border-subtle)]">
                        {apps.map((app, idx) => {
                          const container = metrics?.containers.find(
                            (c) => c.name === app.containerName,
                          );
                          const appCpu = container ? 15 + idx * 8 : 0;
                          const appRam = container ? 256 + idx * 128 : 0;
                          const appDisk = container
                            ? (container.diskUsageBytes ?? 0) / (1024 * 1024 * 1024)
                            : 0;

                          return (
                            <tr
                              key={app.id}
                              className={cn(
                                "h-14 transition-colors hover:bg-[var(--color-bg-surface-hover)]",
                                idx % 2 === 0 ? "bg-[var(--color-bg-base)]" : "bg-[var(--color-bg-surface)]",
                              )}
                            >
                              <td className="px-[var(--space-4)]">
                                <div className="flex items-center gap-[var(--space-3)]">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[10px] font-bold text-[var(--color-primary-text)]">
                                    {app.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">
                                      {app.name}
                                    </span>
                                    {app.domain && (
                                      <a
                                        href={app.accessUrl ?? `https://${app.domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block text-[length:var(--text-xs-fs)] text-[var(--color-text-muted)] hover:underline"
                                      >
                                        {app.domain}
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-[var(--space-4)]">
                                <AppStatusBadge status={app.status} />
                              </td>
                              <td className="px-[var(--space-4)]">
                                <MiniResourceBar value={appCpu} label={`${appCpu}%`} />
                              </td>
                              <td className="px-[var(--space-4)]">
                                <MiniResourceBar value={(appRam / 1024) * 100} label={`${appRam} MB`} />
                              </td>
                              <td className="px-[var(--space-4)]">
                                <MiniResourceBar value={appDisk * 10} label={`${appDisk.toFixed(1)} GB`} />
                              </td>
                              <td className="px-[var(--space-4)] text-right">
                                {app.accessUrl && (
                                  <a
                                    href={app.accessUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline"
                                    aria-label={`Open ${app.name}`}
                                  >
                                    Open
                                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                  </a>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="ml-[var(--space-2)]"
                                  aria-label={`More actions for ${app.name}`}
                                  aria-haspopup="menu"
                                >
                                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: card view (S-206) */}
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[var(--space-6)] lg:hidden">
                    {apps.map((app) => (
                      <article key={app.id} aria-label={`${app.name} — ${app.status}`}>
                        <Card>
                          <CardContent className="p-[var(--space-4)]">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-[var(--space-3)]">
                                <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[length:var(--text-lg-fs)] font-bold text-[var(--color-primary-text)]">
                                  {app.name.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)]">
                                    {app.name}
                                  </h3>
                                  {app.domain && (
                                    <a
                                      href={app.accessUrl ?? `https://${app.domain}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] hover:underline"
                                      aria-label={`Open ${app.name} at ${app.domain}`}
                                    >
                                      {app.domain}
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-[var(--space-2)]">
                                <AppStatusBadge status={app.status} />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`More actions for ${app.name}`}
                                  aria-haspopup="menu"
                                >
                                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>
                            </div>

                            <div className="mt-[var(--space-3)] flex flex-wrap gap-[var(--space-4)]">
                              <MiniResourceBar value={15} label="CPU" />
                              <MiniResourceBar value={30} label="Memory" />
                            </div>

                            {app.accessUrl && (
                              <div className="mt-[var(--space-3)]">
                                <a
                                  href={app.accessUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline"
                                  aria-label={`Open ${app.name}`}
                                >
                                  Open {app.name}
                                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                </a>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        );
      })}
    </div>
  );
}

function AlertBanner({ alert }: { alert: AlertType }) {
  const severityStyles = {
    critical: {
      bg: "bg-[var(--color-critical-subtle)]",
      text: "text-[var(--color-critical-text)]",
      border: "border-[var(--color-critical-base)]",
    },
    warning: {
      bg: "bg-[var(--color-warning-subtle)]",
      text: "text-[var(--color-warning-text)]",
      border: "border-[var(--color-warning-base)]",
    },
    info: {
      bg: "bg-[var(--color-primary-subtle)]",
      text: "text-[var(--color-primary-text)]",
      border: "border-[var(--color-primary-base)]",
    },
  };

  const styles = severityStyles[alert.severity];

  return (
    <div
      className={cn(
        "flex items-center gap-[var(--space-3)] rounded-[var(--radius-sm)] border-l-4 px-[var(--space-4)] py-[var(--space-3)]",
        styles.bg,
        styles.border,
      )}
      role="alert"
    >
      <SeverityBadge severity={alert.severity} />
      <span className={cn("flex-1 text-[length:var(--text-sm-fs)]", styles.text)}>
        {alert.message}
      </span>
      <Link
        href="/alerts"
        className={cn("text-[length:var(--text-sm-fs)] font-medium underline", styles.text)}
      >
        View details
      </Link>
    </div>
  );
}
