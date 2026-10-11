"use client";

import { AlertCircle, Loader2, RotateCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Progress } from "@/components/ui/progress";
import { getRepoProgress, useStartIndexing } from "@/hooks/use-repo";
import type { IndexStatusResponse, Repository } from "@/lib/api";

export function IndexingState({
  repo,
  status,
}: {
  repo: Repository;
  status?: IndexStatusResponse;
}) {
  const indexMutation = useStartIndexing();
  const filesProcessed = status?.filesProcessed ?? repo.filesProcessed;
const filesTotal = status?.filesTotal ?? repo.filesTotal;
const chunkCount = status?.chunkCount ?? repo.chunkCount;
const progress = getRepoProgress({ filesProcessed, filesTotal });
const indexStatus = status?.indexStatus ?? repo.indexStatus;
const errorMessage = status?.errorMessage ?? repo.errorMessage;

  if (indexStatus === "FAILED") {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircle className="text-destructive" />
          </EmptyMedia>
          <EmptyTitle>Indexing failed</EmptyTitle>
          <EmptyDescription className="text-destructive/90">
            {errorMessage ?? "Something went wrong while indexing this repository."}
          </EmptyDescription>
        </EmptyHeader>

        <Button
          variant="outline"
          size="sm"
          onClick={() => indexMutation.mutate(repo.id)}
          disabled={indexMutation.isPending}
        >
          <RotateCcw data-icon="inline-start" />
          Retry indexing
        </Button>
      </Empty>
    );
  }

  if (indexStatus === "PENDING") {
    return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles className="text-primary size-7" />
          </EmptyMedia>
          <EmptyTitle>Repository Not Indexed Yet</EmptyTitle>
          <EmptyDescription className="max-w-md">
            {repo.fullName} has not been indexed yet. Indexing parses your codebase files into vector embeddings so you can ask questions and chat with the AI.
          </EmptyDescription>
        </EmptyHeader>

        <Button
          size="default"
          onClick={() => indexMutation.mutate(repo.id)}
          disabled={indexMutation.isPending}
          className="bg-[#e11d48] hover:bg-[#be123c] text-white shadow-xs font-medium gap-2 cursor-pointer"
        >
          {indexMutation.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Starting indexing...</span>
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              <span>Start Indexing</span>
            </>
          )}
        </Button>
      </Empty>
    );
  }

return (
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Loader2 className="animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Indexing {repo.fullName}</EmptyTitle>
          <EmptyDescription>
            {filesTotal > 0
              ? `${filesProcessed} of ${filesTotal} files · ${chunkCount} chunks embedded`
              : "Fetching repository files and preparing embeddings..."}
          </EmptyDescription>
        </EmptyHeader>
        <div className="w-full max-w-sm space-y-2">
          <Progress value={Math.max(progress, filesTotal ? progress : 12)} />
          <p className="text-center text-xs text-muted-foreground">
            You can leave this page open — chat unlocks when indexing finishes.
          </p>
        </div>
      </Empty>
    );
}