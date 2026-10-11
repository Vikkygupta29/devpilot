"use client";

import React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Loader2,
  MessageSquare,
  Plus,
  RotateCw,
  ShieldAlert,
} from "lucide-react";
import type { ChatSession, Repository } from "@/lib/api";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LanguageBadge } from "@/components/dashboard/language-badge";
import { useStartIndexing } from "@/hooks/use-repo";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  repository: Repository;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onCreateNewSession: () => void;
  isCreatingSession?: boolean;
  className?: string;
}

export function ChatSidebar({
  repository,
  sessions,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  isCreatingSession = false,
  className,
}: ChatSidebarProps) {
  const startIndexing = useStartIndexing();

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card/60 border-r border-border/70 backdrop-blur-md w-72 shrink-0",
        className
      )}
    >
      {/* Top Bar: Back to Dashboard */}
      <div className="p-4 border-b border-border/60 flex items-center justify-between">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 -ml-2 text-xs font-medium"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Repo Details Header Card */}
      <div className="p-4 border-b border-border/60 space-y-2.5 bg-muted/20">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Repository
            </div>
            <div className="text-sm font-bold text-foreground truncate font-mono" title={repository.fullName}>
              {repository.name}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {repository.owner}
            </div>
          </div>

          {repository.language && (
            <LanguageBadge language={repository.language} className="size-8" />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 border-primary/20 bg-primary/5">
              <GitBranch className="h-3 w-3 text-primary" />
              <span>{repository.defaultBranch}</span>
            </Badge>

            {repository.indexStatus === "READY" ? (
              <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 text-emerald-600 border-emerald-500/20 bg-emerald-500/5">
                <CheckCircle2 className="h-3 w-3" />
                <span>Ready</span>
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] gap-1 px-2 py-0.5 text-amber-600 border-amber-500/20 bg-amber-500/5">
                <ShieldAlert className="h-3 w-3" />
                <span>{repository.indexStatus}</span>
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={() => startIndexing.mutate(repository.id)}
            disabled={startIndexing.isPending}
            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border/50 hover:bg-muted/60 transition-all cursor-pointer disabled:opacity-50"
            title="Re-index repository to update code vectors"
          >
            {startIndexing.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
            ) : (
              <RotateCw className="h-3 w-3" />
            )}
            <span>Re-index</span>
          </button>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onCreateNewSession}
          disabled={isCreatingSession || repository.indexStatus !== "READY"}
          className="w-full justify-start gap-2 shadow-xs text-xs font-semibold rounded-xl"
        >
          <Plus className="h-4 w-4" />
          <span>New Chat</span>
        </Button>
      </div>

      {/* Session History List */}
      <div className="flex-1 flex flex-col min-h-0 px-2 pb-2">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Chat History
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-muted-foreground">
              <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-40" />
              No conversations yet. Start a new chat above!
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const timeAgo = session.createdAt
                  ? formatDistanceToNow(new Date(session.createdAt), {
                      addSuffix: true,
                    })
                  : "";

                return (
                  <button
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl transition-all duration-150 flex flex-col gap-1 cursor-pointer group",
                      isActive
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "hover:bg-muted/70 text-foreground border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span className="text-xs font-medium truncate flex-1">
                        {session.title || "New Chat"}
                      </span>
                    </div>

                    {timeAgo && (
                      <span className="text-[10px] text-muted-foreground pl-5.5">
                        {timeAgo}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
