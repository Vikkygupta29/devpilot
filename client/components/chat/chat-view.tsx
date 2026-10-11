"use client";

import React, { useState } from "react";
import { Loader2, Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIndexStatus, useRepository } from "@/hooks/use-repo";
import {
  useChatMessages,
  useChatSessions,
  useCreateSession,
  useSendMessage,
} from "@/hooks/use-chat";
import { IndexingState } from "./indexing-state";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function ChatView({ repoId }: { repoId: string }) {
  const { user } = useAuth();
  const { data: repo, isLoading: isRepoLoading } = useRepository(repoId);
  const { data: status } = useIndexStatus(repoId, repo?.indexStatus === "INDEXING");
  const { data: sessions = [], isLoading: isSessionsLoading } = useChatSessions(repoId);
  const createSessionMutation = useCreateSession();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const selectedSessionId = activeSessionId ?? sessions[0]?.id ?? null;

  const { data: messages = [] } = useChatMessages(selectedSessionId);

  const {
    sendMessage,
    abort,
    isStreaming,
    streamingContent,
    streamingCitations,
  } = useSendMessage(selectedSessionId);

  const handleCreateNewSession = async () => {
    if (!repo) return;
    const newSession = await createSessionMutation.mutateAsync({
      repositoryId: repo.id,
      title: `Chat · ${new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`,
    });
    setActiveSessionId(newSession.id);
    setIsMobileMenuOpen(false);
  };

  const handleSendMessage = async (content: string) => {
    let targetSessionId = selectedSessionId;

    // If no active session exists yet, create one first
    if (!targetSessionId && repo) {
      try {
        const newSession = await createSessionMutation.mutateAsync({
          repositoryId: repo.id,
          title: content.slice(0, 32) + (content.length > 32 ? "..." : ""),
        });
        targetSessionId = newSession.id;
        setActiveSessionId(newSession.id);
      } catch (err) {
        console.error("Failed to create chat session", err);
        return;
      }
    }

    if (targetSessionId) {
      sendMessage(content, targetSessionId);
    }
  };

  // Loading state
  if (isRepoLoading || isSessionsLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center text-sm text-muted-foreground">
        Repository not found.
      </div>
    );
  }

  // If repo is not READY, show indexing state
  const currentIndexStatus = status?.indexStatus ?? repo.indexStatus;
  if (currentIndexStatus !== "READY") {
    return (
      <div className="h-[calc(100vh-4rem)]">
        <IndexingState repo={repo} status={status} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <ChatSidebar
        repository={repo}
        sessions={sessions}
        activeSessionId={selectedSessionId}
        onSelectSession={(id) => setActiveSessionId(id)}
        onCreateNewSession={handleCreateNewSession}
        isCreatingSession={createSessionMutation.isPending}
        className="hidden md:flex"
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background/50">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-3 border-b border-border/70 bg-card/60 backdrop-blur-xs">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="h-8 w-8" />
              }
            >
              <Menu className="h-4 w-4" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <ChatSidebar
                repository={repo}
                sessions={sessions}
                activeSessionId={selectedSessionId}
                onSelectSession={(id) => {
                  setActiveSessionId(id);
                  setIsMobileMenuOpen(false);
                }}
                onCreateNewSession={handleCreateNewSession}
                isCreatingSession={createSessionMutation.isPending}
                className="w-full border-r-0"
              />
            </SheetContent>
          </Sheet>

          <div className="text-xs font-semibold text-foreground truncate px-2 font-mono">
            {repo.fullName}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCreateNewSession}
            disabled={createSessionMutation.isPending}
            className="text-xs h-8"
          >
            + New
          </Button>
        </div>

        {/* Message feed */}
        <ChatMessages
          messages={messages}
          repository={repo}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          streamingCitations={streamingCitations}
          userAvatar={user?.avatarUrl}
          userName={user?.displayName ?? user?.githubUsername ?? "You"}
          onSelectPrompt={handleSendMessage}
        />

        {/* Composer container */}
        <div className="p-4 border-t border-border/60 bg-background/80 backdrop-blur-xs max-w-4xl w-full mx-auto">
          <ChatComposer
            onSend={handleSendMessage}
            onAbort={abort}
            isStreaming={isStreaming}
            disabled={createSessionMutation.isPending}
            placeholder={`Ask DevPilot about ${repo.name}...`}
          />
        </div>
      </div>
    </div>
  );
}