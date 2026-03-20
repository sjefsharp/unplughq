"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";

interface TopBarProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function TopBar({ breadcrumbs = [] }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] px-[var(--space-4)] lg:px-[var(--space-8)]">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-[var(--space-1)]">
        <ol className="flex items-center gap-[var(--space-1)]">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.label} className="flex items-center gap-[var(--space-1)]">
              {index > 0 && (
                <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
              )}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] hover:text-[var(--color-text-base)]"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-[length:var(--text-sm-fs)] font-medium text-[var(--color-text-base)]">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-[var(--space-2)]">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle color theme"}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:hidden" aria-hidden="true" />
          <Moon className="hidden h-5 w-5 transition-all dark:block" aria-hidden="true" />
        </Button>

        {/* Notifications */}
        <NotificationBell />

        {/* User avatar */}
        <Button variant="ghost" size="icon" aria-label="User profile" className="rounded-full">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-subtle)] text-[length:var(--text-sm-fs)] font-medium text-[var(--color-primary-text)]"
            aria-hidden="true"
          >
            U
          </span>
        </Button>
      </div>
    </header>
  );
}
