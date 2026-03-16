import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Validate Connection (Step 2 of 3) — UnplugHQ",
};
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PulseRing } from "@/components/pulse-ring";

/** Placeholder — replaced by tRPC server.get query data once BE is wired. */
const MOCK_SPECS = {
  cpu: "4 Cores (AMD EPYC)",
  ram: "8 GB Total",
  storage: "80 GB (nvme)",
  os: "Ubuntu 24.04 LTS",
} as const;

export default function ValidationPage() {
  return (
    <>
      <div className="text-center">
        <div className="mx-auto mb-[var(--space-4)] flex h-16 w-16 items-center justify-center">
          <PulseRing status="healthy" />
        </div>
        <h1
          className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]"
        >
          Connection successful!
        </h1>
        <p className="mt-[var(--space-2)] text-[var(--color-text-subtle)]">
          We successfully talked to your server via SSH.
        </p>
      </div>

      <div
        className="mt-[var(--space-8)] grid grid-cols-1 gap-[var(--space-4)] sm:grid-cols-2"
        aria-label="Server resources detected"
        role="region"
      >
        {(
          [
            ["CPU", MOCK_SPECS.cpu],
            ["RAM", MOCK_SPECS.ram],
            ["Storage", MOCK_SPECS.storage],
            ["OS", MOCK_SPECS.os],
          ] as const
        ).map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-[var(--space-1)]">
              <CardTitle className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-[var(--color-text-base)]">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-[var(--space-8)]">
        <Button asChild className="w-full">
          <Link href="/connect/provisioning">Continue to setup</Link>
        </Button>
      </div>
    </>
  );
}
