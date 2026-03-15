"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const STEPS = [
  { path: "/connect/credentials", label: "Credentials" },
  { path: "/connect/validation", label: "Validation" },
  { path: "/connect/provisioning", label: "Provisioning" },
] as const;

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentIndex = STEPS.findIndex((s) => pathname.startsWith(s.path));
  const stepNumber = currentIndex === -1 ? 1 : currentIndex + 1;
  const prevHref =
    currentIndex > 0 ? STEPS[currentIndex - 1].path : "/welcome";

  return (
    <div className="mx-auto w-full max-w-[560px] px-[var(--space-4)] py-[var(--space-8)]">
      <nav
        className="mb-[var(--space-6)] flex items-center justify-between"
        aria-label="Wizard navigation"
      >
        <Link
          href={prevHref}
          className="inline-flex items-center gap-[var(--space-1)] text-[length:var(--text-sm-fs)] text-[var(--color-text-subtle)] hover:text-[var(--color-text-base)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
        <span
          className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)]"
          aria-live="polite"
        >
          Step {stepNumber} of {STEPS.length}
        </span>
      </nav>
      {children}
    </div>
  );
}
