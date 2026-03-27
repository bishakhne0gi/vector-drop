"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconCard } from "@/components/icons/IconCard";
import { IconDetailModal } from "@/components/icons/IconDetailModal";
import type { Icon, IconListResponse } from "@/lib/types";

const PAGE_SIZE = 48;

async function fetchMyIcons(offset: number): Promise<IconListResponse> {
  const params = new URLSearchParams({ mine: "true", limit: String(PAGE_SIZE), offset: String(offset) });
  const res = await fetch(`/api/icons?${params.toString()}`);
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Failed to load icons");
  return res.json() as Promise<IconListResponse>;
}

async function patchIcon(id: string, body: { isPublic: boolean }): Promise<void> {
  const res = await fetch(`/api/icons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update icon");
}

async function deleteIcon(id: string): Promise<void> {
  const res = await fetch(`/api/icons/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete icon");
}

export default function MyIconsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [allIcons, setAllIcons] = useState<Icon[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["icons", "mine", offset],
    queryFn: () => fetchMyIcons(offset),
  });

  // Redirect if unauthorized
  useEffect(() => {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      router.push("/login");
    }
  }, [error, router]);

  // Accumulate pages
  useEffect(() => {
    if (!data) return;
    if (offset === 0) {
      setAllIcons(data.icons);
    } else {
      setAllIcons((prev) => [...prev, ...data.icons]);
    }
  }, [data, offset]);

  const visibilityMutation = useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      patchIcon(id, { isPublic }),
    onSuccess: () => {
      setOffset(0);
      setAllIcons([]);
      void queryClient.invalidateQueries({ queryKey: ["icons", "mine"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIcon(id),
    onSuccess: () => {
      setOffset(0);
      setAllIcons([]);
      void queryClient.invalidateQueries({ queryKey: ["icons", "mine"] });
    },
  });

  const handleVisibilityToggle = useCallback(
    (icon: Icon) => {
      visibilityMutation.mutate({ id: icon.id, isPublic: !icon.is_public });
    },
    [visibilityMutation],
  );

  const handleDelete = useCallback(
    (icon: Icon) => {
      deleteMutation.mutate(icon.id);
    },
    [deleteMutation],
  );

  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + PAGE_SIZE);
  }, []);

  const hasMore = data?.hasMore ?? false;
  const isFirstLoad = isLoading && offset === 0;
  const mutationError = visibilityMutation.error ?? deleteMutation.error;

  return (
    <>
      <main className="mx-auto w-full max-w-7xl px-8 py-16">
        {/* Header */}
        <header className="mb-12 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">My Icons</h1>
            <p className="mt-2 text-sm text-foreground/50">
              Icons you have generated
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/icons"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
            >
              Icon Library
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground/60 transition-opacity hover:opacity-70"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {/* Mutation error */}
        {mutationError && (
          <p className="mb-6 text-sm text-destructive">
            {(mutationError as Error).message}
          </p>
        )}

        {/* Error (non-auth) */}
        {error && !(error instanceof Error && error.message === "UNAUTHORIZED") && (
          <p className="mb-8 text-sm text-destructive">Failed to load icons. Try refreshing.</p>
        )}

        {/* Loading spinner */}
        {isFirstLoad && (
          <div className="flex justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isFirstLoad && allIcons.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-foreground/40">
              You haven&apos;t generated any icons yet.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground/60 transition-opacity hover:opacity-70"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Grid */}
        {allIcons.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {allIcons.map((icon) => (
              <IconCard
                key={icon.id}
                icon={icon}
                onClick={setSelectedIcon}
                showAdminActions
                onVisibilityToggle={handleVisibilityToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

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
