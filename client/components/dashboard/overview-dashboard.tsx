"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardHeader } from "./dashboard-header";
import { DashboardStats } from "./dashboard-stats";
import { RepoCard } from "./repo-card";
import { Button } from "@/components/ui/button";
import { useRepos } from "@/hooks/use-repo";

export function OverviewDashboard() {
  const { data: repos = [] } = useRepos();

  const readyRepos = repos.filter((r) => r.indexStatus === "READY");
  const unindexedRepos = repos.filter((r) => r.indexStatus !== "READY").slice(0, 6);

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader
        title="Overview"
        totalCount={repos.length}
        readyCount={readyRepos.length}
        showSearch={false}
      />

      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-8">
        {/* Metric Stats Cards */}
        <DashboardStats repos={repos} />

        {/* Ready for Chat Section */}
        {readyRepos.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-foreground">
                  Ready for Chat
                </h2>
                <p className="text-xs text-muted-foreground">
                  Repositories fully indexed and ready for retrieval-augmented queries.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground"
                render={<Link href="/dashboard" />}
              >
                <span>View all</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyRepos.slice(0, 3).map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </div>
          </section>
        )}

        {/* All Repositories / Quick Indexing Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-bold text-foreground">
                Recent Repositories
              </h2>
              <p className="text-xs text-muted-foreground">
                Connected GitHub repositories available for indexing.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              render={<Link href="/dashboard" />}
            >
              <span>Manage Repositories</span>
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unindexedRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
