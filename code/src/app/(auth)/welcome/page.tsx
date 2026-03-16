import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Welcome — UnplugHQ",
};
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function WelcomePage() {
  return (
    <Card className="max-w-[var(--space-160,640px)]">
      <CardHeader className="text-center">
        <CardTitle
          className="text-[length:var(--text-3xl-fs)] leading-[var(--text-3xl-lh)]"
        >
          Welcome to your private cloud
        </CardTitle>
        <CardDescription className="text-[length:var(--text-base-fs)]">
          We&apos;ll help you connect your server securely, and have your first
          application running in under 15 minutes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-[var(--space-6)]">
        <div
          className="rounded-[var(--radius-lg)] bg-[var(--color-surface-raised)] p-[var(--space-6)]"
          role="list"
          aria-label="What you'll need"
        >
          <p className="mb-[var(--space-3)] font-semibold text-[var(--color-text-base)]">
            What you&apos;ll need:
          </p>
          <ul className="space-y-[var(--space-2)] text-[var(--color-text-subtle)]">
            <li role="listitem" className="flex items-center gap-[var(--space-2)]">
              <span className="text-[var(--color-success-text)]" aria-hidden="true">&#10003;</span>
              A server (VPS) IP address
            </li>
            <li role="listitem" className="flex items-center gap-[var(--space-2)]">
              <span className="text-[var(--color-success-text)]" aria-hidden="true">&#10003;</span>
              SSH login credentials (Key or Password)
            </li>
          </ul>
        </div>
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/connect/credentials">Connect your server</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
