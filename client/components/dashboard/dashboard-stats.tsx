"use client";

import React from "react";
import { FolderGit2, CheckCircle2, Loader2, Layers } from "lucide-react";
import { Repository } from "@/lib/api";

interface DashboardStatsProps {
  repos: Repository[];
}

export function DashboardStats({ repos }: DashboardStatsProps) {
  const total = repos.length;
  const ready = repos.filter((r) => r.indexStatus === "READY").length;
  const indexing = repos.filter((r) => r.indexStatus === "INDEXING").length;
  const totalChunks = repos.reduce((sum, r) => sum + (r.chunkCount || 0), 0);

  const stats = [
    {
      title: "Connected Repos",
      value: total,
      description: "Total GitHub repositories",
      icon: FolderGit2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Ready for Chat",
      value: ready,
      description: "Indexed and searchable",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Active Indexing",
      value: indexing,
      description: "Processing code chunks",
      icon: Loader2,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      spin: indexing > 0,
    },
    {
      title: "Total Chunks",
      value: totalChunks.toLocaleString(),
      description: "Embedded vector chunks",
      icon: Layers,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.title}
            className="flex items-center gap-4 rounded-2xl bg-card border border-border/70 p-4.5 shadow-xs"
          >
            <div
              className={`flex size-11 items-center justify-center rounded-xl shrink-0 ${item.bg} ${item.color}`}
            >
              <Icon className={`size-5.5 ${item.spin ? "animate-spin" : ""}`} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-muted-foreground">{item.title}</span>
              <div className="font-heading text-xl font-bold tracking-tight text-foreground">
                {item.value}
              </div>
              <p className="text-[11px] text-muted-foreground/80 truncate">{item.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
