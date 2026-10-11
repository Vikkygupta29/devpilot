"use client";

import React from "react";
import { AlertCircle, CheckCircle2, Loader2, Clock } from "lucide-react";
import { IndexStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RepoStatusBadgeProps {
  status?: IndexStatus | null;
  className?: string;
  showIcon?: boolean;
}

export function RepoStatusBadge({
  status,
  className,
  showIcon = false,
}: RepoStatusBadgeProps) {
  if (status === "READY") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 select-none",
          className
        )}
      >
        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        {showIcon && <CheckCircle2 className="size-3" />}
        <span>Ready</span>
      </span>
    );
  }

  if (status === "INDEXING") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 select-none",
          className
        )}
      >
        <Loader2 className="size-3 animate-spin text-amber-500" />
        <span>Indexing</span>
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 select-none",
          className
        )}
      >
        <AlertCircle className="size-3 text-rose-500" />
        <span>Failed</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight bg-muted/70 text-muted-foreground border border-border/60 select-none",
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-muted-foreground/40" />
      {showIcon && <Clock className="size-3" />}
      <span>Not indexed</span>
    </span>
  );
}

