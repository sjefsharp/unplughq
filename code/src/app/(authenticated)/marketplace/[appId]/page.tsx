"use client";

import { use } from "react";
import Link from "next/link";
import { ExternalLink, ChevronRight } from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MarketplaceDetailPage({
  params,
}: {
  params: Promise<{ appId: string }>;
}) {
  const { appId } = use(params);
  const { data: app, isLoading } = trpc.app.catalog.get.useQuery({ id: appId });
  const { data: servers } = trpc.server.list.useQuery();
  const hasProvisionedServer = (servers ?? []).some(
    (server) => server.status === "validated" || server.status === "provisioned",
  );

  if (isLoading) {
    return (
      <div className="space-y-[var(--space-6)]">
        <Skeleton className="h-6 w-64" />
        <div className="grid gap-[var(--space-8)] lg:grid-cols-[3fr_2fr]">
          <div className="space-y-[var(--space-4)]">
            <Skeleton className="h-16 w-16 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div>
            <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="py-[var(--space-16)] text-center">
        <h1 className="text-[length:var(--text-2xl-fs)] font-bold text-[var(--color-text-base)]">
          App not found
        </h1>
        <p className="mt-[var(--space-2)] text-[var(--color-text-muted)]">
          This application doesn&apos;t exist in our catalog.
        </p>
        <Button asChild className="mt-[var(--space-6)]">
          <Link href="/marketplace">Back to catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-[var(--space-1)]">
        <Link
          href="/marketplace"
          className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
        >
          Catalog
        </Link>
        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
        <span className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">
          {app.name}
        </span>
      </nav>

      {/* Content */}
      <div className="grid gap-[var(--space-8)] lg:grid-cols-[3fr_2fr]">
        {/* Left column */}
        <div className="space-y-[var(--space-6)]">
          <div className="flex items-start gap-[var(--space-4)]">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[length:var(--text-2xl-fs)] font-bold text-[var(--color-primary-text)]">
              {app.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-bold text-[var(--color-text-base)]">
                {app.name}
              </h1>
              <span className="inline-flex mt-[var(--space-1)] rounded-full bg-[var(--color-primary-subtle)] px-[var(--space-3)] text-[length:var(--text-xs-fs)] uppercase font-semibold tracking-[0.05em] text-[var(--color-primary-text)]">
                {app.category}
              </span>
            </div>
          </div>

          <p className="text-[length:var(--text-base-fs)] leading-relaxed text-[var(--color-text-base)]">
            {app.description}
          </p>
        </div>

        {/* Right sidebar */}
        <div className="space-y-[var(--space-4)]">
          <Card>
            <CardContent className="space-y-[var(--space-4)] p-[var(--space-6)]">
              <h2 className="text-[length:var(--text-sm-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
                Requirements
              </h2>
              <dl className="space-y-[var(--space-2)]">
                <div className="flex justify-between">
                  <dt className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">Memory</dt>
                  <dd className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">{app.minRamGb} GB</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">Storage</dt>
                  <dd className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">{app.minDiskGb} GB</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">CPU</dt>
                  <dd className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">{app.minCpuCores} cores</dd>
                </div>
              </dl>

              <div className="space-y-[var(--space-2)] pt-[var(--space-2)]">
                <p className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
                  Version {app.version}
                </p>
                <a
                  href={app.upstreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-primary-text)] hover:underline"
                >
                  Open-source project
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>

              {hasProvisionedServer ? (
                <Button size="lg" className="w-full" asChild>
                  <Link href={`/deploy/${app.id}/configure`}>
                    Deploy {app.name}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="w-full" disabled aria-disabled="true">
                    Deploy {app.name}
                  </Button>
                  <p className="text-[length:var(--text-xs-fs)] text-[var(--color-text-subtle)]">
                    Connect a server before deploying this app.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
