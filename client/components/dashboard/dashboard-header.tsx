"use client";

import React from "react";
import { RefreshCw, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRefreshRepos } from "@/hooks/use-repo";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title?: string;
  totalCount?: number;
  readyCount?: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  showSync?: boolean;
}

export function DashboardHeader({
  title = "Repositories",
  totalCount,
  readyCount,
  searchQuery = "",
  onSearchChange,
  showSearch = true,
  showSync = true,
}: DashboardHeaderProps) {
  const refreshRepos = useRefreshRepos();

  return (
    <header className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3.5 transition-colors">
      {/* Left side: Title & Stats */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div>
          <h1 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {typeof totalCount === "number" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 font-medium">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[11px] font-semibold border border-blue-500/20">
                <span className="size-1.5 rounded-full bg-blue-500" />
                {totalCount} connected
              </span>
              {typeof readyCount === "number" && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-semibold border border-emerald-500/20">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  {readyCount} ready
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Search, Sync, Theme */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto">
        {showSearch && onSearchChange && (
          <div className="relative flex-1 sm:w-64 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search repositories..."
              className="h-9 pl-9 pr-8 text-xs bg-muted/40 hover:bg-muted/60 border-border/80 rounded-lg focus-visible:ring-1 focus-visible:bg-background transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground rounded-xs"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}

        {showSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshRepos.mutate()}
            disabled={refreshRepos.isPending}
            className="h-9 gap-1.5 text-xs font-medium border-border/80 bg-card hover:bg-muted/80 transition-colors shadow-xs"
          >
            <RefreshCw
              className={cn("size-3.5", refreshRepos.isPending && "animate-spin text-primary")}
            />
            <span>{refreshRepos.isPending ? "Syncing..." : "Sync"}</span>
          </Button>
        )}

        <ModeToggle />
      </div>
    </header>
  );
}

