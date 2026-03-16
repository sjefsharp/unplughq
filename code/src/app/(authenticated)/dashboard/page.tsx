import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dashboard — UnplugHQ",
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusIndicator } from "@/components/status-indicator";
import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder — replaced by tRPC server.list query once BE is wired. */
const MOCK_SERVER = null as null | {
  ip: string;
  status: "healthy" | "attention" | "offline";
  cpuPercent: number;
  ramPercent: number;
  diskPercent: number;
};

export default function DashboardPage() {
  const server = MOCK_SERVER;

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex items-center justify-between">
        <h1
          className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]"
        >
          Dashboard
        </h1>
      </div>

      {server ? (
        <>
          {/* Server status bar */}
          <Card>
            <CardContent className="flex flex-wrap items-center gap-[var(--space-4)] py-[var(--space-4)]">
              <StatusIndicator status={server.status} />
              <span className="text-[var(--color-text-subtle)]">
                {server.ip}
              </span>
              <span className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
                CPU: {server.cpuPercent}% | RAM: {server.ramPercent}% | Disk:{" "}
                {server.diskPercent}%
              </span>
              <Button variant="outline" size="sm" className="ml-auto">
                Restart
              </Button>
            </CardContent>
          </Card>

          {/* App grid — populated in Sprint 2 */}
          <section aria-label="Your applications">
            <div className="mb-[var(--space-4)] flex items-center justify-between">
              <h2
                className="text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)]"
              >
                Your applications
              </h2>
              <Button size="sm">
                <Link href="/marketplace">Add app</Link>
              </Button>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-[var(--space-6)]">
              {/* Placeholder skeleton tiles for Sprint 2 */}
              <Card>
                <CardContent className="space-y-[var(--space-3)] py-[var(--space-4)]">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      ) : (
        /* Empty state */
        <Card>
          <CardHeader className="text-center pb-[var(--space-2)]">
            <CardTitle
              className="text-[length:var(--text-lg-fs)] text-[var(--color-text-base)]"
            >
              No apps running yet.
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-[var(--space-6)] text-[var(--color-text-subtle)]">
              Deploy your first application.
            </p>
            <Button asChild>
              <Link href="/welcome">Connect your server</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
