"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  GitBranch,
  Layers,
  Loader2,
  MessageSquare,
  Sparkles,
  Lock,
} from "lucide-react";
import { Repository } from "@/lib/api";
import { LanguageBadge, LanguageTag } from "./language-badge";
import { RepoStatusBadge } from "./repo-status";
import { GithubIcon } from "@/components/icons/github-icon";
import { Button } from "@/components/ui/button";
import { useStartIndexing, getRepoProgress } from "@/hooks/use-repo";

interface RepoCardProps {
  repo: Repository;
}

export function RepoCard({ repo }: RepoCardProps) {
  const startIndexing = useStartIndexing();
  const isIndexing = repo.indexStatus === "INDEXING" || startIndexing.isPending;
  const isReady = repo.indexStatus === "READY";
  const isFailed = repo.indexStatus === "FAILED";
  const isNotIndexed = !isReady && !isIndexing && !isFailed;

  const progress = getRepoProgress(repo);

  return (
    <div className="group relative flex flex-col justify-between rounded-xl bg-card border border-border/80 dark:border-zinc-800/80 p-5 shadow-xs hover:border-zinc-400/80 dark:hover:border-zinc-700/90 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <LanguageBadge language={repo.language} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                <span className="truncate">{repo.owner}</span>
                {repo.isPrivate && <Lock className="size-3 shrink-0 text-muted-foreground" />}
              </div>
              {isReady ? (
                <Link href={`/chat/${repo.id}`} className="block">
                  <h2 className="font-heading font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors cursor-pointer">
                    {repo.name}
                  </h2>
                </Link>
              ) : (
                <h2 className="font-heading font-semibold text-sm sm:text-base text-foreground truncate group-hover:text-primary transition-colors">
                  {repo.name}
                </h2>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            <RepoStatusBadge status={repo.indexStatus} />
          </div>
        </div>

        {/* Indexing Progress Bar */}
        {isIndexing && (
          <div className="mb-3 space-y-1.5 rounded-lg bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-2.5">
            <div className="flex justify-between text-[11px] font-medium font-mono text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <Loader2 className="size-3 animate-spin" />
                Indexing codebase...
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-amber-500/20">
              <div
                className="h-full bg-amber-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-8 mb-4 leading-relaxed">
          {repo.description || "No description provided."}
        </p>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-4">
          {/* Branch */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 font-mono text-[11px]">
            <GitBranch className="size-3 text-muted-foreground" />
            <span className="truncate max-w-28">{repo.defaultBranch || "main"}</span>
          </div>

          {/* Language */}
          {repo.language && <LanguageTag language={repo.language} />}

          {/* Chunks */}
          {repo.chunkCount > 0 && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted/50 border border-border/50 text-[11px] font-mono">
              <Layers className="size-3 text-muted-foreground" />
              <span>{repo.chunkCount.toLocaleString()} chunks</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/50">
        {/* GitHub Link */}
        {repo.htmlUrl ? (
          <a
            href={repo.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/60"
          >
            <GithubIcon className="size-3.5" />
            <span>GitHub</span>
            <ExternalLink className="size-2.5 opacity-60" />
          </a>
        ) : (
          <div />
        )}

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2">
          {isReady && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-border bg-background hover:bg-muted font-medium"
                render={<Link href={`/chat/${repo.id}`} />}
              >
                <MessageSquare className="size-3.5" />
                <span>Chat</span>
              </Button>

              <Button
                size="sm"
                className="gap-1.5 text-xs bg-[#e11d48] hover:bg-[#be123c] text-white shadow-xs font-medium"
                render={<Link href={`/chat/${repo.id}`} />}
              >
                <span>Open</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </>
          )}

          {isNotIndexed && (
            <Button
              size="sm"
              onClick={() => startIndexing.mutate(repo.id)}
              disabled={startIndexing.isPending}
              className="gap-1.5 text-xs bg-[#e11d48] hover:bg-[#be123c] text-white shadow-xs active:scale-[0.98] transition-all font-medium"
            >
              <Sparkles className="size-3.5" />
              <span>Index</span>
            </Button>
          )}

          {isIndexing && (
            <Button size="sm" disabled className="gap-1.5 text-xs opacity-75">
              <Loader2 className="size-3.5 animate-spin" />
              <span>Indexing...</span>
            </Button>
          )}

          {isFailed && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => startIndexing.mutate(repo.id)}
              disabled={startIndexing.isPending}
              className="gap-1.5 text-xs font-medium"
            >
              <span>Retry</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
