"use client";

import { useRouteChangeFocus } from "@/hooks/use-focus-management";

/**
 * B-251: Provider that manages route-change focus.
 * Placed inside root layout so every route transition moves focus.
 */
export function RouteAnnouncer({ children }: { children: React.ReactNode }) {
  const announcement = useRouteChangeFocus();

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {children}
    </>
  );
}
