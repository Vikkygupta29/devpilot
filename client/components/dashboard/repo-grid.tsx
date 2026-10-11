"use client";

import React from "react";
import { FolderGit2, RefreshCw, SearchX, AlertCircle } from "lucide-react";
import { Repository } from "@/lib/api";
import { RepoCard } from "./repo-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RepoGridProps {
  repos: Repository[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
  onClearFilters?: () => void;
  isFiltered?: boolean;
}

export function RepoGrid({
  repos,
  isLoading,
  isError,
  errorMessage,
  onRefresh,
  onClearFilters,
  isFiltered,
}: RepoGridProps) {
  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card/60 p-5 space-y-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-20 bg-muted rounded-xs" />
                <div className="h-4 w-36 bg-muted rounded-xs" />
              </div>
              <div className="h-5 w-16 bg-muted rounded-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-muted rounded-xs" />
              <div className="h-3 w-2/3 bg-muted rounded-xs" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border/40">
              <div className="h-4 w-16 bg-muted rounded-xs" />
              <div className="h-4 w-20 bg-muted rounded-xs" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-12 text-center my-6">
        <AlertCircle className="size-10 text-destructive mb-3" />
        <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
          Failed to load repositories
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-5">
          {errorMessage || "An unexpected error occurred while fetching your repositories."}
        </p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="size-3.5" />
            <span>Try Again</span>
          </Button>
        )}
      </div>
    );
  }

  // Empty Filtered State (Search returned 0 results)
  if (repos.length === 0 && isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center my-6">
        <SearchX className="size-10 text-muted-foreground mb-3 opacity-60" />
        <h3 className="font-heading text-base font-semibold text-foreground mb-1">
          No repositories found
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          No repositories match your current filter and search criteria.
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters} variant="secondary" size="sm" className="text-xs">
            Clear all filters
          </Button>
        )}
      </div>
    );
  }

  // Empty Repositories State (No repos connected yet)
  if (repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center my-6">
        <FolderGit2 className="size-12 text-muted-foreground mb-3 opacity-60" />
        <h3 className="font-heading text-lg font-semibold text-foreground mb-1">
          No repositories connected yet
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mb-5">
          Connect your GitHub account to sync your public and private repositories and start chatting with your codebase.
        </p>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            size="sm"
            disabled={isLoading}
            className="gap-2 bg-[#e11d48] hover:bg-[#be123c] text-white shadow-sm font-medium px-4 py-2"
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            <span>{isLoading ? "Connecting Repositories..." : "Connect GitHub Repositories"}</span>
          </Button>
        )}
      </div>
    );
  }

  // Repositories Grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {repos.map((repo) => (
        <RepoCard key={repo.id} repo={repo} />
      ))}
    </div>
  );
}
