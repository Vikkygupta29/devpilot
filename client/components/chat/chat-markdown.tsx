"use client";

import React, { memo } from "react";
import { Streamdown } from "streamdown";
import "./chat-markdown.css";

interface ChatMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

export const ChatMarkdown = memo(function ChatMarkdown({
  content,
  isStreaming = false,
}: ChatMarkdownProps) {
  if (!content && isStreaming) {
    return (
      <div className="flex items-center gap-1.5 py-1 text-sm text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-primary/70 animate-ping" />
        <span>Thinking...</span>
      </div>
    );
  }

  return (
    <div className="chat-markdown">
      <Streamdown>{content}</Streamdown>
      {isStreaming && <span className="chat-cursor" />}
    </div>
  );
});
