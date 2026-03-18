"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * B-251: On route change, move focus to <main> or page heading.
 * Screen readers announce new page context.
 */
export function useRouteChangeFocus() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const temporaryTabIndexRef = useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    const frame = window.requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>("main h1, h1");
      const main = document.getElementById("main-content") as HTMLElement | null;
      const target = heading ?? main;

      if (!target) return;

      if (temporaryTabIndexRef.current && temporaryTabIndexRef.current !== main) {
        temporaryTabIndexRef.current.removeAttribute("tabindex");
        temporaryTabIndexRef.current = null;
      }

      if (!target.hasAttribute("tabindex")) {
        target.setAttribute("tabindex", "-1");
        if (target !== main) {
          temporaryTabIndexRef.current = target;
        }
      }

      target.focus({ preventScroll: false });
      const nextAnnouncement = heading?.textContent?.trim() || document.title || "Page updated";
      setAnnouncement(nextAnnouncement);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return announcement;
}

/**
 * B-251: Modal close returns focus to triggering element.
 * Returns a ref to attach to the trigger, and a function to restore focus.
 */
export function useFocusReturn() {
  const triggerRef = useRef<HTMLElement | null>(null);

  const saveTrigger = useCallback((element: HTMLElement | null) => {
    triggerRef.current = element;
  }, []);

  const restoreFocus = useCallback(() => {
    if (triggerRef.current) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, []);

  return { saveTrigger, restoreFocus };
}
