"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { trpc } from "@/server/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CatalogApp } from "@/lib/schemas";

const CATEGORIES = [
  "All",
  "File Storage",
  "Communication",
  "Productivity",
  "Development",
  "Media",
  "Security",
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const deferredSearch = useDeferredValue(search);

  const { data: apps, isLoading } = trpc.app.catalog.list.useQuery(
    activeCategory !== "All" ? { category: activeCategory } : undefined,
  );

  const filtered = useMemo(() => {
    if (!apps) return [];
    if (!deferredSearch.trim()) return apps;
    const q = deferredSearch.toLowerCase();
    return apps.filter(
      (app: CatalogApp) =>
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q),
    );
  }, [apps, deferredSearch]);

  return (
    <div className="space-y-[var(--space-6)]">
      {/* Header */}
      <div>
        <h1 className="text-[length:var(--text-2xl-fs)] leading-[var(--text-2xl-lh)] font-bold text-[var(--color-text-base)]">
          Browse apps for your server
        </h1>
        <p className="mt-[var(--space-2)] text-[length:var(--text-base-fs)] text-[var(--color-text-muted)]">
          Choose from our curated collection of open-source applications.
        </p>
      </div>

      {/* Search & Filters */}
      <section className="space-y-[var(--space-3)]" role="search" aria-label="Search apps">
        <div className="relative max-w-[480px]">
          <Search className="absolute left-[var(--space-3)] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-subtle)]" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search apps by name or description"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Search apps by name or description"
          />
        </div>

        <p className="sr-only" aria-live="polite">
          {filtered.length} apps available after filtering.
        </p>

        <div className="flex flex-wrap gap-[var(--space-3)]" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "h-8 rounded-full border px-[var(--space-3)] text-[length:var(--text-sm-fs)] font-medium transition-colors",
                activeCategory === cat
                  ? "border-[var(--color-primary-base)] bg-[var(--color-primary-subtle)] text-[var(--color-primary-text)]"
                  : "border-[var(--color-border-base)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-surface-hover)]",
              )}
              aria-pressed={activeCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[var(--space-6)]">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-[var(--space-3)] p-[var(--space-4)]">
                <Skeleton className="h-12 w-12 rounded-[var(--radius-sm)]" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-8 w-28 mt-[var(--space-2)]" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-[var(--space-16)] text-center">
          <p className="text-[length:var(--text-base-fs)] text-[var(--color-text-muted)]">
            {apps && apps.length === 0
              ? "No apps available yet. Check back soon."
              : "No apps match your search. Try a different term or browse by category."}
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[var(--space-6)]"
          role="list"
          aria-label="Application catalog"
        >
          {filtered.map((app: CatalogApp) => (
            <article
              key={app.id}
              role="listitem"
              className="group"
              aria-label={app.name}
            >
              <Link href={`/marketplace/${app.id}`} className="block focus:outline-none focus:ring-4 focus:ring-[var(--color-primary-base)] rounded-[var(--radius-lg)]">
                <Card className="h-full flex flex-col p-[var(--space-4)] transition-all group-hover:border-[var(--color-border-base)]">
                  <CardContent className="flex flex-1 flex-col gap-[var(--space-3)] p-0">
                    {/* Icon fallback */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary-subtle)] text-[length:var(--text-lg-fs)] font-bold text-[var(--color-primary-text)]">
                      {app.name.charAt(0)}
                    </div>

                    <h2 className="text-[length:var(--text-lg-fs)] font-semibold text-[var(--color-text-base)] group-hover:text-[var(--color-primary-text)] transition-colors truncate">
                      {app.name}
                    </h2>

                    <p className="text-[length:var(--text-sm-fs)] text-[var(--color-text-muted)] line-clamp-2">
                      {app.description}
                    </p>

                    <span className="inline-flex self-start rounded-full bg-[var(--color-primary-subtle)] px-[var(--space-3)] text-[length:var(--text-xs-fs)] uppercase font-semibold tracking-[0.05em] text-[var(--color-primary-text)]">
                      {app.category}
                    </span>

                    <p className="text-[length:var(--text-xs-fs)] text-[var(--color-text-subtle)]">
                      Needs {app.minRamGb} GB memory and {app.minDiskGb} GB storage
                    </p>

                    <div className="mt-auto pt-[var(--space-2)]">
                      <Button size="sm" className="pointer-events-none" tabIndex={-1} aria-hidden="true">
                        Deploy {app.name}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
