"use client";

import { useRouter } from "next/navigation";
import { useSSE, type SSEMessage } from "@/hooks/use-sse";
import { Progress } from "@/components/ui/progress";
import { PulseRing } from "@/components/pulse-ring";

export default function ProvisioningPage() {
  const router = useRouter();
  const { messages, connected } = useSSE({ url: "/api/events" });

  const latestMessage = messages[messages.length - 1] as SSEMessage | undefined;
  const progress = deriveProgress(messages);
  const isComplete = progress >= 100;

  if (isComplete) {
    // Brief delay before redirect to let user see completion
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-[var(--space-4)] flex h-16 w-16 items-center justify-center">
        <PulseRing status={isComplete ? "healthy" : "deploying"} />
      </div>

      <h1
        className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-semibold text-[var(--color-text-base)]"
      >
        {isComplete ? "Server is ready!" : "Setting up your server…"}
      </h1>

      <p
        className="mt-[var(--space-2)] text-[var(--color-text-subtle)]"
        aria-live="polite"
      >
        {isComplete
          ? "Redirecting to your dashboard."
          : "Validating credentials and checking server resources."}
      </p>

      <div className="mt-[var(--space-8)]">
        <Progress value={progress} aria-label="Provisioning progress" />
      </div>

      <div
        className="mt-[var(--space-6)] mx-auto max-h-20 overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-surface-raised)] p-[var(--space-3)] font-mono text-[length:var(--text-xs-fs)] text-[var(--color-text-muted)] text-left"
        role="log"
        aria-live="polite"
        aria-label="Provisioning log"
      >
        {messages.length === 0 && !connected && (
          <p>Connecting to provisioning service…</p>
        )}
        {messages.map((msg, i) => (
          <p key={i}>&gt; {msg.data}</p>
        ))}
      </div>

      {latestMessage && (
        <p
          className="mt-[var(--space-3)] text-[length:var(--text-sm-fs)] text-[var(--color-text-subtle)]"
          aria-live="polite"
        >
          Current task: {latestMessage.data}
        </p>
      )}

      <p className="sr-only" aria-live="assertive">
        {isComplete ? "Provisioning complete" : `Provisioning ${progress}% complete`}
      </p>
    </div>
  );
}

/** Estimate progress from SSE messages. BE sends structured events — this is a placeholder. */
function deriveProgress(messages: SSEMessage[]): number {
  if (messages.length === 0) return 0;
  // Crude heuristic — real implementation uses structured job events
  return Math.min(messages.length * 15, 100);
}
