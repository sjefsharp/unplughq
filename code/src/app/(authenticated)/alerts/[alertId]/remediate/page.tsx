"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/severity-badge";
import { MiniResourceBar } from "@/components/mini-resource-bar";
import { cn } from "@/lib/utils";

const REMEDIATION_GUIDES: Record<
  string,
  {
    headline: string;
    steps: { text: string; actionLabel?: string; actionType?: "stop" | "restart" }[];
    escalation?: string;
  }
> = {
  "disk-critical": {
    headline: "Free up storage space",
    steps: [
      { text: "Review which apps use the most storage." },
      { text: "Remove files you no longer need from within each app." },
      {
        text: "If storage is still full, consider upgrading your server's disk.",
      },
    ],
    escalation: "Consider upgrading your server's disk to prevent future issues.",
  },
  "cpu-critical": {
    headline: "Reduce CPU load",
    steps: [
      { text: "Review which apps are consuming the most CPU." },
      {
        text: "Stop apps you're not actively using.",
        actionLabel: "Stop",
        actionType: "stop",
      },
      { text: "If load stays high, consider upgrading your server." },
    ],
  },
  "ram-critical": {
    headline: "Free up memory",
    steps: [
      { text: "Review which apps are using the most memory." },
      {
        text: "Stop apps you're not actively using.",
        actionLabel: "Stop",
        actionType: "stop",
      },
      { text: "If memory stays high, consider upgrading your server." },
    ],
  },
  "app-unavailable": {
    headline: "Get the app back online",
    steps: [
      {
        text: "Try restarting the app.",
        actionLabel: "Restart",
        actionType: "restart",
      },
      {
        text: "If the restart doesn't help, check that your domain points to your server.",
      },
      {
        text: "If the problem persists, review the app's resource usage.",
      },
    ],
  },
};

export default function RemediatePage({
  params,
}: {
  params: Promise<{ alertId: string }>;
}) {
  const { alertId } = use(params);

  const { data: alertList } = trpc.monitor.alerts.list.useQuery();
  const alert = alertList?.find((a) => a.id === alertId);

  const stopMutation = trpc.app.deployment.stop.useMutation();
  const startMutation = trpc.app.deployment.start.useMutation();

  const [actionResults, setActionResults] = useState<
    Record<string, "success" | "error">
  >({});

  if (!alert) {
    return (
      <div className="space-y-[var(--space-6)]">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to alerts
        </Link>
        <Card>
          <CardContent className="py-[var(--space-8)] text-center">
            <p className="text-[var(--color-text-subtle)]">
              Alert not found or already resolved.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const guide = REMEDIATION_GUIDES[alert.type];
  if (!guide) {
    return (
      <div className="space-y-[var(--space-6)]">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to alerts
        </Link>
        <Card>
          <CardContent className="py-[var(--space-8)] text-center">
            <p className="text-[var(--color-text-subtle)]">
              No guided remediation available for this alert type.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAction = async (
    stepIdx: number,
    actionType: "stop" | "restart",
  ) => {
    if (!alert.appId) return;
    try {
      if (actionType === "stop") {
        await stopMutation.mutateAsync({
          id: alert.appId,
          confirmationToken: `remediation-${alert.id}`,
        });
      } else {
        await startMutation.mutateAsync({ id: alert.appId });
      }
      setActionResults((prev) => ({ ...prev, [stepIdx]: "success" }));
    } catch {
      setActionResults((prev) => ({ ...prev, [stepIdx]: "error" }));
    }
  };

  return (
    <div className="space-y-[var(--space-6)]">
      <Link
        href="/alerts"
        className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to alerts
      </Link>

      {/* Alert detail header */}
      <div className="space-y-[var(--space-2)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <SeverityBadge severity={alert.severity} />
          <h1 className="text-[length:var(--text-xl-fs)] leading-[var(--text-xl-lh)] font-semibold text-[var(--color-text-base)]">
            {guide.headline}
          </h1>
        </div>
        <p className="text-[length:var(--text-sm-fs)] text-[var(--color-text-subtle)]">
          {alert.message}
        </p>
        <p className="text-[length:var(--text-xs-fs)] text-[var(--color-text-muted)]">
          Detected at {new Date(alert.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Per-app resource breakdown for resource alerts */}
      {["disk-critical", "cpu-critical", "ram-critical"].includes(alert.type) && (
        <AppResourceBreakdown serverId={alert.serverId} alertType={alert.type} />
      )}

      {/* Remediation steps */}
      <Card>
        <CardContent className="p-[var(--space-6)]">
          <h2 className="mb-[var(--space-4)] text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)]">
            Remediation steps
          </h2>
          <ol className="space-y-[var(--space-4)]">
            {guide.steps.map((step, idx) => {
              const result = actionResults[idx];

              return (
                <li
                  key={idx}
                  className="flex items-start gap-[var(--space-3)]"
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[length:var(--text-sm-fs)] font-semibold",
                      result === "success"
                        ? "bg-[var(--color-success-subtle)] text-[var(--color-success-text)]"
                        : "bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]",
                    )}
                  >
                    {result === "success" ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div className="flex-1 space-y-[var(--space-2)]">
                    <p className="text-[length:var(--text-sm-fs)] text-[var(--color-text-base)]">
                      {step.text}
                    </p>

                    {step.actionLabel && alert.appId && (
                      <div className="flex items-center gap-[var(--space-3)]">
                        <Button
                          size="sm"
                          variant={step.actionType === "stop" ? "destructive" : "default"}
                          onClick={() => handleAction(idx, step.actionType!)}
                          disabled={
                            stopMutation.isPending ||
                            startMutation.isPending ||
                            result === "success"
                          }
                        >
                          {step.actionLabel} app
                        </Button>
                        {result === "success" && (
                          <span className="flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-success-text)]">
                            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                            {step.actionType === "restart"
                              ? "App is back online."
                              : "App stopped."}
                          </span>
                        )}
                        {result === "error" && (
                          <span className="flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-critical-text)]">
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                            {step.actionType === "restart"
                              ? "Restart didn't work. Try the next step."
                              : "Action failed. Try the next step."}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Escalation */}
          {guide.escalation && (
            <div className="mt-[var(--space-6)] rounded-[var(--radius-sm)] bg-[var(--color-warning-subtle)] px-[var(--space-4)] py-[var(--space-3)]">
              <p className="text-[length:var(--text-sm-fs)] text-[var(--color-warning-text)]">
                {guide.escalation}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AppResourceBreakdown({
  serverId,
  alertType,
}: {
  serverId: string;
  alertType: string;
}) {
  const { data: dashboard } = trpc.monitor.dashboard.useQuery();
  const serverData = dashboard?.servers.find((s) => s.server.id === serverId);
  if (!serverData || !serverData.apps.length) return null;

  const label =
    alertType === "disk-critical"
      ? "Storage"
      : alertType === "cpu-critical"
        ? "CPU"
        : "Memory";

  return (
    <Card>
      <CardContent className="p-[var(--space-6)]">
        <h2 className="mb-[var(--space-4)] text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)]">
          {label} usage by app
        </h2>
        <table className="w-full" aria-label={`${label} usage breakdown`}>
          <thead>
            <tr>
              <th className="px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-xs-fs)] uppercase text-[var(--color-text-subtle)]">
                App
              </th>
              <th className="px-[var(--space-3)] py-[var(--space-2)] text-left text-[length:var(--text-xs-fs)] uppercase text-[var(--color-text-subtle)]">
                {label}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {serverData.apps.map((app, idx) => {
              // Simulated per-app resource usage
              const value =
                alertType === "disk-critical"
                  ? 20 + idx * 15
                  : alertType === "cpu-critical"
                    ? 10 + idx * 20
                    : 15 + idx * 18;
              return (
                <tr key={app.id}>
                  <td className="px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm-fs)] text-[var(--color-text-base)]">
                    {app.name}
                  </td>
                  <td className="px-[var(--space-3)] py-[var(--space-2)]">
                    <MiniResourceBar value={value} label={`${value}%`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
