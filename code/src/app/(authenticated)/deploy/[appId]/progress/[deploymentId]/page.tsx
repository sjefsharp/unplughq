"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Loader2,
  Circle,
  ExternalLink,
  Globe,
  Lock,
  Monitor,
  Network,
  TriangleAlert,
} from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { useSSE } from "@/hooks/use-sse";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/lib/schemas";
import { MOCK_PENDING_DEPLOYMENT_ID } from "@/lib/mock-data";

const DEPLOYMENT_PHASES: Array<{
  status: DeploymentStatus;
  label: string;
  description: string;
}> = [
  { status: "pending", label: "Preparing", description: "Getting everything ready for your app." },
  { status: "pulling", label: "Downloading", description: "Downloading your app. This may take a moment." },
  { status: "configuring", label: "Configuring", description: "Applying your settings." },
  { status: "provisioning-ssl", label: "Securing", description: "Setting up a secure connection for your domain." },
  { status: "starting", label: "Starting", description: "Starting your app. Almost there." },
  { status: "running", label: "Running", description: "Your app is live and ready to use." },
];

function getPhaseIndex(status: DeploymentStatus): number {
  const idx = DEPLOYMENT_PHASES.findIndex((p) => p.status === status);
  return idx >= 0 ? idx : -1;
}

export default function ProgressPage({
  params,
}: {
  params: Promise<{ appId: string; deploymentId: string }>;
}) {
  const { appId, deploymentId } = use(params);
  const { data: app } = trpc.app.catalog.get.useQuery({ id: appId });
  const { data: deployment } = trpc.app.deployment.get.useQuery(
    { id: deploymentId },
    { refetchInterval: 60_000 },
  );

  const [currentStatus, setCurrentStatus] = useState<DeploymentStatus>("pending");
  const [failed, setFailed] = useState(false);
  const [failedPhase, setFailedPhase] = useState<string | null>(null);

  // SSE for real-time deployment progress
  const handleSSEMessage = useCallback(
    (msg: { event: string; data: string }) => {
      try {
        const parsed = JSON.parse(msg.data);
        if (parsed.deploymentId === deploymentId && parsed.status) {
          const status = parsed.status as DeploymentStatus;
          if (status === "failed") {
            setFailed(true);
            setFailedPhase(parsed.phase ?? null);
          } else {
            setCurrentStatus(status);
          }
        }
      } catch {
        // Ignore parse errors
      }
    },
    [deploymentId],
  );

  const { connected, retryCount, exhausted } = useSSE({
    url: "/api/events",
    enabled: !failed && currentStatus !== "running",
    onMessage: handleSSEMessage,
  });

  // Sync from initial query
  useEffect(() => {
    if (deployment?.status) {
      if (deployment.status === "failed") {
        setFailed(true);
      } else {
        setCurrentStatus(deployment.status);
      }
    }
  }, [deployment?.status]);

  useEffect(() => {
    if (deploymentId !== MOCK_PENDING_DEPLOYMENT_ID || failed || currentStatus === "running") {
      return;
    }

    const sequence: DeploymentStatus[] = [
      "pending",
      "pulling",
      "configuring",
      "provisioning-ssl",
      "starting",
      "running",
    ];
    const currentIndex = sequence.indexOf(currentStatus);

    const timer = window.setTimeout(() => {
      const nextStatus = sequence[Math.min(currentIndex + 1, sequence.length - 1)];
      setCurrentStatus(nextStatus);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [currentStatus, deploymentId, failed]);

  const currentPhaseIdx = getPhaseIndex(currentStatus);
  const isComplete = currentStatus === "running" && !failed;
  const progressPercent = failed
    ? (getPhaseIndex(failedPhase as DeploymentStatus) / DEPLOYMENT_PHASES.length) * 100
    : ((currentPhaseIdx + 1) / DEPLOYMENT_PHASES.length) * 100;

  const appName = app?.name ?? "App";
  const accessUrl = deployment?.accessUrl;

  return (
    <div className="mx-auto max-w-[640px] space-y-[var(--space-6)]">
      <h1 className="text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)]">
        {isComplete
          ? `${appName} is running. You are officially self-hosting.`
          : failed
            ? "Something went wrong"
            : `Deploying ${appName}`}
      </h1>

      {/* DNS warning */}
      {!isComplete && !failed && (
        <div className="flex items-start gap-[var(--space-3)] rounded-[var(--radius-sm)] bg-[var(--color-warning-subtle)] px-[var(--space-4)] py-[var(--space-3)]" role="status" aria-live="polite">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-warning-text)]" aria-hidden="true" />
          <p className="text-[length:var(--text-sm-fs)] text-[var(--color-warning-text)]">
            Your domain doesn&apos;t point to this server yet. The app will deploy, but it won&apos;t be reachable until DNS propagates.
          </p>
        </div>
      )}

      {!connected && retryCount > 0 && !exhausted && !isComplete && !failed && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] px-[var(--space-4)] py-[var(--space-3)]" role="status" aria-live="polite">
          <p className="text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)]">
            Reconnecting to live deployment updates.
          </p>
        </div>
      )}

      {exhausted && !isComplete && !failed && (
        <div className="rounded-[var(--radius-sm)] bg-[var(--color-bg-surface)] px-[var(--space-4)] py-[var(--space-3)]" role="status" aria-live="polite">
          <p className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
            Live updates are unavailable. Refreshing every 60 seconds.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-[var(--space-6)]">
          {/* Overall progress bar */}
          <div className="mb-[var(--space-6)]">
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-border-subtle)]">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-[var(--dur-base)] ease-[var(--ease-standard)]",
                  failed ? "bg-[var(--color-critical-base)]" : "bg-[var(--color-success-base)]",
                )}
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progressPercent)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Deployment progress"
              />
            </div>
          </div>

          {/* Phase list */}
          <ol className="space-y-[var(--space-1)]" aria-label="Deployment phases">
            {DEPLOYMENT_PHASES.map((phase, idx) => {
              const isCompleted = idx < currentPhaseIdx || isComplete;
              const isActive = idx === currentPhaseIdx && !failed && !isComplete;
              const isFailed = failed && phase.status === failedPhase;
              const isUpcoming = idx > currentPhaseIdx && !isComplete;

              return (
                <li key={phase.status} className="flex gap-[var(--space-3)]">
                  {/* Connector + icon */}
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                        isCompleted
                          ? "bg-[var(--color-success-base)]"
                          : isFailed
                            ? "bg-[var(--color-critical-base)]"
                            : isActive
                              ? "bg-[var(--color-primary-base)]"
                              : "border border-[var(--color-border-base)]",
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : isFailed ? (
                        <X className="h-3 w-3 text-white" />
                      ) : isActive ? (
                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                      ) : (
                        <Circle className="h-2 w-2 text-[var(--color-text-subtle)]" />
                      )}
                    </div>
                    {idx < DEPLOYMENT_PHASES.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 flex-1 min-h-[16px]",
                          isCompleted
                            ? "bg-[var(--color-success-base)]"
                            : "bg-[var(--color-border-subtle)]",
                        )}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="pb-[var(--space-4)]">
                    <p
                      className={cn(
                        "text-[length:var(--text-base-fs)] font-medium",
                        isCompleted
                          ? "text-[var(--color-success-text)]"
                          : isFailed
                            ? "text-[var(--color-critical-text)]"
                            : isActive
                              ? "text-[var(--color-text-base)]"
                              : "text-[var(--color-text-subtle)]",
                      )}
                    >
                      {isFailed ? "Something went wrong" : phase.label}
                    </p>
                    <p
                      className={cn(
                        "text-[length:var(--text-sm-fs)]",
                        isUpcoming
                          ? "text-[var(--color-text-subtle)]"
                          : "text-[var(--color-text-muted)]",
                      )}
                    >
                      {isFailed
                        ? "We couldn't complete the deployment. See details below."
                        : phase.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Verification badges (S-205) — shown on success */}
          {isComplete && (
            <div className="mt-[var(--space-4)] space-y-[var(--space-2)] border-t border-[var(--color-border-subtle)] pt-[var(--space-4)]" role="status" aria-live="polite">
              <div className="flex items-center gap-[var(--space-2)] h-9">
                <Monitor className="h-4 w-4 text-[var(--color-success-text)]" aria-hidden="true" />
                <Check className="h-3.5 w-3.5 text-[var(--color-success-text)]" aria-hidden="true" />
                <span className="text-[length:var(--text-sm-fs)] text-[var(--color-success-text)]">Container started</span>
              </div>
              <div className="flex items-center gap-[var(--space-2)] h-9">
                <Lock className="h-4 w-4 text-[var(--color-success-text)]" aria-hidden="true" />
                <Check className="h-3.5 w-3.5 text-[var(--color-success-text)]" aria-hidden="true" />
                <span className="text-[length:var(--text-sm-fs)] text-[var(--color-success-text)]">Secure connection active</span>
              </div>
              <div className="flex items-center gap-[var(--space-2)] h-9">
                <Globe className="h-4 w-4 text-[var(--color-success-text)]" aria-hidden="true" />
                <Check className="h-3.5 w-3.5 text-[var(--color-success-text)]" aria-hidden="true" />
                <span className="text-[length:var(--text-sm-fs)] text-[var(--color-success-text)]">
                  App responding at {accessUrl ?? deployment?.domain}
                </span>
              </div>
              <div className="flex items-center gap-[var(--space-2)] h-9">
                <Network className="h-4 w-4 text-[var(--color-success-text)]" aria-hidden="true" />
                <Check className="h-3.5 w-3.5 text-[var(--color-success-text)]" aria-hidden="true" />
                <span className="text-[length:var(--text-sm-fs)] text-[var(--color-success-text)]">Domain resolving correctly</span>
              </div>

              {accessUrl && (
                <a
                  href={accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-[var(--space-2)] inline-flex items-center gap-[var(--space-2)] text-[length:var(--text-lg-fs)] font-medium text-[var(--color-primary-text)] underline"
                >
                  Open {appName}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          )}

          {/* Failed state */}
          {failed && (
            <div className="mt-[var(--space-4)] rounded-[var(--radius-sm)] bg-[var(--color-critical-subtle)] p-[var(--space-4)]" role="alert">
              <p className="text-[length:var(--text-sm-fs)] text-[var(--color-critical-text)]">
                Deployment didn&apos;t complete. No leftover files were left on your server.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background hint */}
      {!isComplete && !failed && (
        <p className="text-center text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
          You can leave this page. Deployment continues in the background.
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-[var(--space-4)]">
        {isComplete && (
          <>
            {accessUrl && (
              <Button asChild>
                <a href={accessUrl} target="_blank" rel="noopener noreferrer">
                  Open {appName}
                </a>
              </Button>
            )}
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </>
        )}
        {failed && (
          <>
            <Button asChild>
              <Link href={`/deploy/${appId}/configure`}>Try again</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
