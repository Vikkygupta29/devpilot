"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (message: string) => void;
  onAbort?: () => void;
  isStreaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const SUGGESTED_PROMPTS = [
  "Explain the project structure and architecture",
  "How does authentication work in this codebase?",
  "Where are the main API endpoints defined?",
  "Find any security vulnerabilities or improvements",
];

export function ChatComposer({
  onSend,
  onAbort,
  isStreaming = false,
  disabled = false,
  placeholder = "Ask anything about this codebase...",
  className,
}: ChatComposerProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const maxHeight = 200;
      const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${Math.max(52, nextHeight)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming && onAbort) {
      onAbort();
      return;
    }
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleSelectPrompt = (prompt: string) => {
    if (disabled || isStreaming) return;
    onSend(prompt);
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      {/* Suggestions chips (only when input is empty and not streaming) */}
      {!content && !isStreaming && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-primary" /> Suggestions:
          </span>
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPrompt(prompt)}
              disabled={disabled}
              className="text-xs bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-150 rounded-full px-3 py-1 border border-border/50 text-left truncate max-w-[260px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl border border-border/80 bg-background/95 backdrop-blur-xs shadow-md focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all p-2.5">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full resize-none bg-transparent px-2.5 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60 min-h-[44px] max-h-[200px] leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 px-1 border-t border-border/30 mt-1">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground select-none">
            <span className="hidden sm:inline-flex items-center gap-1">
              Press <Kbd className="text-[10px] px-1 py-0.5">Enter</Kbd> to send, <Kbd className="text-[10px] px-1 py-0.5">Shift + Enter</Kbd> for new line
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isStreaming ? (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={onAbort}
                className="h-8 w-8 rounded-full shadow-xs"
                title="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                disabled={!content.trim() || disabled}
                onClick={handleSubmit}
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-200 shadow-xs",
                  content.trim()
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground opacity-50"
                )}
                title="Send message"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
