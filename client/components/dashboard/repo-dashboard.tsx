"use client";

import React, { useMemo, useState } from "react";
import { DashboardHeader } from "./dashboard-header";
import { RepoFilters, VisibilityFilter, StatusFilter, FilterCounts } from "./repo-filters";
import { RepoGrid } from "./repo-grid";
import { useRepos, useRefreshRepos } from "@/hooks/use-repo";

export function RepoDashboard() {
  const { data: repos = [], isLoading, isError, error } = useRepos();
  const refreshRepos = useRefreshRepos();
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Computed counts for filter pills
  const filterCounts = useMemo<FilterCounts>(() => {
    return {
      total: repos.length,
      publicCount: repos.filter((r) => !r.isPrivate).length,
      privateCount: repos.filter((r) => r.isPrivate).length,
      readyCount: repos.filter((r) => r.indexStatus === "READY").length,
      indexingCount: repos.filter((r) => r.indexStatus === "INDEXING").length,
      failedCount: repos.filter((r) => r.indexStatus === "FAILED").length,
      notIndexedCount: repos.filter(
        (r) => !r.indexStatus || (r.indexStatus !== "READY" && r.indexStatus !== "INDEXING" && r.indexStatus !== "FAILED")
      ).length,
    };
  }, [repos]);

  // Filtered repositories based on search, visibility, and status
  const filteredRepos = useMemo(() => {
    return repos.filter((repo) => {
      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = repo.name?.toLowerCase().includes(query);
        const matchesFullName = repo.fullName?.toLowerCase().includes(query);
        const matchesOwner = repo.owner?.toLowerCase().includes(query);
        const matchesLang = repo.language?.toLowerCase().includes(query);
        const matchesDesc = repo.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesFullName && !matchesOwner && !matchesLang && !matchesDesc) {
          return false;
        }
      }

      // Visibility filter
      if (visibilityFilter === "public" && repo.isPrivate) return false;
      if (visibilityFilter === "private" && !repo.isPrivate) return false;

      // Status filter
      if (statusFilter === "READY" && repo.indexStatus !== "READY") return false;
      if (statusFilter === "INDEXING" && repo.indexStatus !== "INDEXING") return false;
      if (statusFilter === "FAILED" && repo.indexStatus !== "FAILED") return false;
      if (
        statusFilter === "NOT_INDEXED" &&
        (repo.indexStatus === "READY" ||
          repo.indexStatus === "INDEXING" ||
          repo.indexStatus === "FAILED")
      ) {
        return false;
      }

      return true;
    });
  }, [repos, searchQuery, visibilityFilter, statusFilter]);

  const isFiltered = Boolean(
    searchQuery.trim() || visibilityFilter !== "all" || statusFilter !== "all"
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setVisibilityFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dashboard Top Header */}
      <DashboardHeader
        title="Repositories"
        totalCount={repos.length}
        readyCount={filterCounts.readyCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
        {/* Filters Toolbar */}
        <RepoFilters
          visibility={visibilityFilter}
          onVisibilityChange={setVisibilityFilter}
          status={statusFilter}
          onStatusChange={setStatusFilter}
          counts={filterCounts}
        />

        {/* Repositories Grid */}
        <RepoGrid
          repos={filteredRepos}
          isLoading={isLoading || refreshRepos.isPending}
          isError={isError}
          errorMessage={error instanceof Error ? error.message : undefined}
          onRefresh={() => refreshRepos.mutate()}
          onClearFilters={handleClearFilters}
          isFiltered={isFiltered}
        />
      </main>
    </div>
  );
}

