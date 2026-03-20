"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SummaryPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: app, isLoading } = trpc.app.catalog.get.useQuery({ id: appId });
  const createDeployment = trpc.app.deployment.create.useMutation();
  const storageKey = `deploy-config:${appId}`;
  const [storedConfig, setStoredConfig] = useState<{
    serverId: string;
    domain: string;
    adminEmail: string;
    config: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const saved = window.sessionStorage.getItem(storageKey);
    if (!saved) return;

    try {
      setStoredConfig(JSON.parse(saved));
    } catch {
      setStoredConfig(null);
    }
  }, [storageKey]);

  const configData = useMemo(() => {
    const raw = searchParams.get("c");
    if (!raw) return storedConfig;
    try {
      return JSON.parse(decodeURIComponent(raw)) as {
        serverId: string;
        domain: string;
        adminEmail: string;
        config: Record<string, string>;
      };
    } catch {
      return storedConfig;
    }
  }, [searchParams, storedConfig]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[640px] space-y-[var(--space-6)]">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  if (!app || !configData) {
    return (
      <div className="py-[var(--space-16)] text-center">
        <h1 className="text-[length:var(--text-2xl-fs)] font-bold text-[var(--color-text-base)]">
          Configuration missing
        </h1>
        <Button asChild className="mt-[var(--space-6)]">
          <Link href={`/deploy/${appId}/configure`}>Start over</Link>
        </Button>
      </div>
    );
  }

  async function handleDeploy() {
    if (!configData) return;
    try {
      const result = await createDeployment.mutateAsync({
        catalogAppId: appId,
        serverId: configData.serverId,
        domain: configData.domain,
        config: { ...configData.config, adminEmail: configData.adminEmail },
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(storageKey, JSON.stringify(configData));
      }
      router.push(`/deploy/${appId}/progress/${result.deploymentId}`);
    } catch {
      // Error handled by tRPC error display
    }
  }

  return (
    <div className="mx-auto max-w-[640px] space-y-[var(--space-6)]">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-[var(--space-1)]">
        <Link
          href="/marketplace"
          className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
          Catalog
        </Link>
        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <Link
          href={`/marketplace/${appId}`}
          className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
          {app.name}
        </Link>
        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <span className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">
          Review
        </span>
      </nav>

      <div>
        <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-bold text-[var(--color-text-base)]">
          Review your settings
        </h1>
        <p className="mt-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
          Confirm everything looks right before deploying.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-[var(--space-4)] p-[var(--space-6)]">
          <div className="space-y-[var(--space-2)]">
            <span className="text-[length:var(--text-sm-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
              Domain
            </span>
            <p className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">
              {configData.domain}
            </p>
          </div>

          <div className="space-y-[var(--space-2)]">
            <span className="text-[length:var(--text-sm-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
              Admin email
            </span>
            <p className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">
              {configData.adminEmail}
            </p>
          </div>

          {Object.entries(configData.config).map(([key, value]) => (
            <div key={key} className="space-y-[var(--space-2)]">
              <span className="text-[length:var(--text-sm-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
                {key}
              </span>
              <p className="text-[length:var(--text-base-fs)] font-medium text-[var(--color-text-base)]">
                {value}
              </p>
            </div>
          ))}

          <div className="flex items-center gap-[var(--space-3)] pt-[var(--space-2)]">
            <Link
              href={`/deploy/${appId}/configure`}
              className="text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline"
            >
              Edit configuration
            </Link>
          </div>
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={handleDeploy}
        disabled={createDeployment.isPending}
        aria-busy={createDeployment.isPending}
      >
        {createDeployment.isPending ? "Deploying…" : `Deploy ${app.name}`}
      </Button>

      {createDeployment.isError && (
        <div role="alert" className="rounded-[var(--radius-sm)] bg-[var(--color-critical-subtle)] p-[var(--space-4)] text-[length:var(--text-sm-fs)] text-[var(--color-critical-text)]">
          {createDeployment.error.message}
        </div>
      )}
    </div>
  );
}
