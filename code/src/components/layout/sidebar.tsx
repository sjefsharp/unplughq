"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Settings, Menu, X, Server, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PulseRing } from "@/components/pulse-ring";

interface SidebarProps {
  className?: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-[var(--space-3)] top-[var(--space-3)] z-50 lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
        aria-controls="sidebar-nav"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-nav"
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full w-[260px] flex-col border-r border-[var(--color-border-subtle)] bg-[var(--color-bg-base)] transition-transform duration-[var(--dur-base)]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-[var(--space-4)]">
          <Link href="/dashboard" className="flex items-center gap-[var(--space-2)]">
            <span
              className="text-[length:var(--text-xl-fs)] font-bold tracking-tight text-[var(--color-text-base)]"
            >
              UnplugHQ
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation links */}
        <nav className="flex flex-1 flex-col gap-[var(--space-1)] px-[var(--space-3)] py-[var(--space-2)]">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] px-[var(--space-3)] py-[var(--space-2)] text-[length:var(--text-sm-fs)] font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-hover)] hover:text-[var(--color-text-base)]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Server status */}
        <div className="border-t border-[var(--color-border-subtle)] p-[var(--space-4)]">
          <div className="text-[length:var(--text-xs-fs)] font-semibold uppercase tracking-[0.05em] text-[var(--color-text-muted)]">
            Server
          </div>
          <div className="mt-[var(--space-2)] flex items-center gap-[var(--space-2)]">
            <Server className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" />
            <span className="text-[length:var(--text-sm-fs)] text-[var(--color-text-base)]">
              192.168.1.1
            </span>
          </div>
          <div className="mt-[var(--space-1)] flex items-center gap-[var(--space-2)]">
            <PulseRing status="healthy" />
            <span className="text-[length:var(--text-sm-fs)] text-[var(--color-success-text)]">
              Healthy
            </span>
          </div>
        </div>

        {/* Logout */}
        <div className="border-t border-[var(--color-border-subtle)] p-[var(--space-4)]">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/login">Log out</Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
