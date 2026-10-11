"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface IndexErrorAlertProps {
  repoName?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function IndexErrorAlert({
  repoName,
  errorMessage,
  onRetry,
  isRetrying = false,
}: IndexErrorAlertProps) {
  if (!errorMessage) return null;

  return (
    <Alert variant="destructive" className="rounded-xl border-destructive/30 bg-destructive/10">
      <AlertCircle className="size-4 text-destructive" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
        <div>
          <AlertTitle className="text-sm font-semibold">
            {repoName ? `Indexing Failed: ${repoName}` : "Indexing Error"}
          </AlertTitle>
          <AlertDescription className="text-xs text-destructive/90 mt-0.5">
            {errorMessage}
          </AlertDescription>
        </div>
        {onRetry && (
          <Button
            size="xs"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="gap-1 text-xs shrink-0 border-destructive/40 hover:bg-destructive/20 text-destructive"
          >
            <RefreshCw className={`size-3 ${isRetrying ? "animate-spin" : ""}`} />
            <span>{isRetrying ? "Retrying..." : "Retry Indexing"}</span>
          </Button>
        )}
      </div>
    </Alert>
  );
}
