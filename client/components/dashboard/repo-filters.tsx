"use client";

import React from "react";
import { IndexStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

export type VisibilityFilter = "all" | "public" | "private";
export type StatusFilter = "all" | IndexStatus | "NOT_INDEXED";

export interface FilterCounts {
  total: number;
  publicCount: number;
  privateCount: number;
  readyCount: number;
  indexingCount: number;
  notIndexedCount: number;
  failedCount: number;
}

interface RepoFiltersProps {
  visibility: VisibilityFilter;
  onVisibilityChange: (val: VisibilityFilter) => void;
  status: StatusFilter;
  onStatusChange: (val: StatusFilter) => void;
  counts?: FilterCounts;
}

export function RepoFilters({
  visibility,
  onVisibilityChange,
  status,
  onStatusChange,
  counts,
}: RepoFiltersProps) {
  const visibilityOptions: { label: string; value: VisibilityFilter; count?: number }[] = [
    { label: "All", value: "all", count: counts?.total },
    { label: "Public", value: "public", count: counts?.publicCount },
    { label: "Private", value: "private", count: counts?.privateCount },
  ];

  const statusOptions: { label: string; value: StatusFilter; count?: number }[] = [
    { label: "All", value: "all", count: counts?.total },
    { label: "Ready", value: "READY", count: counts?.readyCount },
    { label: "Indexing", value: "INDEXING", count: counts?.indexingCount },
    { label: "New", value: "NOT_INDEXED", count: counts?.notIndexedCount },
    { label: "Failed", value: "FAILED", count: counts?.failedCount },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-2">
      {/* Visibility Filters */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground mr-0.5">Visibility:</span>
        <div className="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border/60">
          {visibilityOptions.map((opt) => {
            const isActive = visibility === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onVisibilityChange(opt.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all select-none cursor-pointer",
                  isActive
                    ? "bg-background text-foreground shadow-xs font-semibold border border-border/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <span>{opt.label}</span>
                {typeof opt.count === "number" && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1 rounded-sm",
                      isActive ? "bg-muted text-foreground" : "text-muted-foreground/70"
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <span className="text-xs font-medium text-muted-foreground mr-0.5 shrink-0">Status:</span>
        <div className="inline-flex p-0.5 rounded-lg bg-muted/60 border border-border/60 shrink-0">
          {statusOptions.map((opt) => {
            const isActive = status === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onStatusChange(opt.value)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all select-none cursor-pointer",
                  isActive
                    ? "bg-background text-foreground shadow-xs font-semibold border border-border/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <span>{opt.label}</span>
                {typeof opt.count === "number" && opt.count > 0 && (
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1 rounded-sm",
                      isActive ? "bg-muted text-foreground font-bold" : "text-muted-foreground/70"
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

