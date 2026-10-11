"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, Check, Copy, Sparkles, User as UserIcon } from "lucide-react";
import type { ChatMessage, Citation, Repository } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChatMarkdown } from "./chat-markdown";
import { CitationChips } from "./citation-chips";
import { cn } from "@/lib/utils";

interface ChatMessagesProps {
  messages: ChatMessage[];
  repository: Repository;
  isStreaming?: boolean;
  streamingContent?: string;
  streamingCitations?: Citation[];
  userAvatar?: string | null;
  userName?: string;
  onSelectPrompt?: (prompt: string) => void;
}

export function ChatMessages({
  messages,
  repository,
  isStreaming = false,
  streamingContent = "",
  streamingCitations = [],
  userAvatar,
  userName = "You",
  onSelectPrompt,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasMessages = messages.length > 0 || isStreaming;

  if (!hasMessages) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
          <Bot className="h-7 w-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            Chat with {repository.fullName}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            I have indexed <span className="font-semibold text-foreground">{repository.filesProcessed} files</span> and{" "}
            <span className="font-semibold text-foreground">{repository.chunkCount} code chunks</span>.
            Ask me questions about code logic, architecture, bug fixes, or how features are implemented.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
          <button
            type="button"
            onClick={() => onSelectPrompt?.("Explain the high-level architecture and data flow.")}
            className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/50 transition-all text-left space-y-1.5 cursor-pointer group shadow-2xs active:scale-[0.99]"
          >
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Architecture
            </div>
            <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
              &quot;Explain the high-level architecture and data flow.&quot;
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectPrompt?.("Show me how requests are handled and routed.")}
            className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/50 transition-all text-left space-y-1.5 cursor-pointer group shadow-2xs active:scale-[0.99]"
          >
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Logic & APIs
            </div>
            <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
              &quot;Show me how requests are handled and routed.&quot;
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectPrompt?.("Find any potential bugs or security improvements in this codebase.")}
            className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/50 transition-all text-left space-y-1.5 cursor-pointer group shadow-2xs active:scale-[0.99]"
          >
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Security & Quality
            </div>
            <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
              &quot;Find any potential bugs or security improvements.&quot;
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectPrompt?.("Summarize what this repository does and its main components.")}
            className="p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-card hover:border-primary/50 transition-all text-left space-y-1.5 cursor-pointer group shadow-2xs active:scale-[0.99]"
          >
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 group-hover:text-primary transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Code Summary
            </div>
            <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
              &quot;Summarize what this repository does and its main components.&quot;
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 max-w-4xl w-full mx-auto">
      {messages.map((msg) => {
        const isUser = msg.role === "USER";
        const isCopied = copiedId === msg.id;

        return (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3.5 group",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {/* Assistant Avatar */}
            {!isUser && (
              <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-primary/20 bg-primary/10 shadow-2xs mt-0.5">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}

            {/* Message Bubble Container */}
            <div
              className={cn(
                "flex flex-col max-w-[85%] sm:max-w-[78%] space-y-1.5",
                isUser ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs relative transition-all",
                  isUser
                    ? "bg-primary text-primary-foreground font-medium rounded-br-xs"
                    : "bg-card border border-border/70 text-card-foreground rounded-tl-xs shadow-xs"
                )}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <ChatMarkdown content={msg.content} />
                )}

                {/* Citations for assistant messages */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <CitationChips citations={msg.citations} />
                )}
              </div>

              {/* Action bar on hover */}
              {!isUser && (
                <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Copy response"
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {isUser && (
              <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-border/80 bg-muted mt-0.5 shadow-2xs">
                {userAvatar ? (
                  <AvatarImage src={userAvatar} alt={userName} />
                ) : null}
                <AvatarFallback className="text-xs bg-muted font-medium">
                  <UserIcon className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}

      {/* Streaming message bubble */}
      {isStreaming && (
        <div className="flex gap-3.5 justify-start">
          <Avatar className="h-8 w-8 rounded-lg shrink-0 border border-primary/20 bg-primary/10 shadow-2xs mt-0.5">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col max-w-[85%] sm:max-w-[78%] space-y-1.5 items-start">
            <div className="rounded-2xl rounded-tl-xs px-4 py-3 text-sm leading-relaxed shadow-xs bg-card border border-border/70 text-card-foreground">
              <ChatMarkdown content={streamingContent} isStreaming={true} />

              {streamingCitations.length > 0 && (
                <CitationChips citations={streamingCitations} />
              )}
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
}
