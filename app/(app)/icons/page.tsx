"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { IconCard } from "@/components/icons/IconCard";
import { IconDetailModal } from "@/components/icons/IconDetailModal";
import { cn } from "@/lib/utils";
import type { Icon, IconListResponse } from "@/lib/types";

type StyleFilter = "all" | Icon["style"];

const STYLE_OPTIONS: { value: StyleFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "outline", label: "Outline" },
  { value: "flat", label: "Flat" },
  { value: "duotone", label: "Duotone" },
];

const PAGE_SIZE = 48;

async function fetchIcons(
  search: string,
  style: StyleFilter,
  offset: number,
): Promise<IconListResponse> {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
  if (search) params.set("search", search);
  if (style !== "all") params.set("style", style);
  const res = await fetch(`/api/icons?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load icons");
  return res.json() as Promise<IconListResponse>;
}

function IconSkeletonGrid() {
  return (
    <>
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square animate-pulse rounded-2xl border border-border bg-foreground/5"
        />
      ))}
    </>
  );
}

export default function IconLibraryPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [style, setStyle] = useState<StyleFilter>("all");
  const [offset, setOffset] = useState(0);
  const [allIcons, setAllIcons] = useState<Icon[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0);
      setAllIcons([]);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  // Reset when style changes
  useEffect(() => {
    setOffset(0);
    setAllIcons([]);
  }, [style]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["icons", "public", debouncedSearch, style, offset],
    queryFn: () => fetchIcons(debouncedSearch, style, offset),
  });

  // Accumulate pages
  useEffect(() => {
    if (!data) return;
    if (offset === 0) {
      setAllIcons(data.icons);
    } else {
      setAllIcons((prev) => [...prev, ...data.icons]);
    }
  }, [data, offset]);

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + PAGE_SIZE);
  }, []);

  const hasMore = data?.hasMore ?? false;
  const isFirstLoad = isLoading && offset === 0;

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-8 py-16">
        {/* Header */}
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Icon Library</h1>
            <p className="mt-2 text-sm text-foreground/50">
              AI-generated Lucide-style icons, free to use
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
            >
              Dashboard
            </Link>
            <Link
              href="/icons/my"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
            >
              My Icons
            </Link>
          </div>
        </header>

        {/* Search + Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons…"
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex items-center rounded-xl border border-border p-1">
            {STYLE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStyle(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  style === opt.value
                    ? "bg-foreground text-background"
                    : "text-foreground/60 hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && !isFirstLoad && (
          <p className="mb-8 text-sm text-destructive">Failed to load icons. Try refreshing.</p>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {isFirstLoad ? (
            <IconSkeletonGrid />
          ) : allIcons.length === 0 && !isLoading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm text-foreground/40">
                No icons yet. Be the first to generate one!
              </p>
              <Link
                href="/dashboard"
                className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/60 transition-opacity hover:opacity-70"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            allIcons.map((icon) => (
              <IconCard key={icon.id} icon={icon} onClick={setSelectedIcon} />
            ))
          )}
        </div>

        {/* Load more */}
        {hasMore && !isLoading && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium text-foreground/60 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              Load more
            </button>
          </div>
        )}

        {isLoading && offset > 0 && (
          <div className="mt-12 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          </div>
        )}
      </main>

      <IconDetailModal icon={selectedIcon} onClose={() => setSelectedIcon(null)} />
    </>
  );
}
