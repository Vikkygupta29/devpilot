"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { api, type ChatMessage, type ChatSession, type Citation } from "@/lib/api";
import { queryKeys } from "./query-keys";
import { toast } from "@/components/ui/toast";

export function useChatSessions(repositoryId: string) {
  return useQuery({
    queryKey: queryKeys.chat.sessions(repositoryId),
    queryFn: () => api.listSessions(repositoryId),
    enabled: Boolean(repositoryId),
  });
}

export function useChatMessages(sessionId: string | null) {
  return useQuery({
    queryKey: queryKeys.chat.messages(sessionId ?? ""),
    queryFn: () => (sessionId ? api.getMessages(sessionId) : Promise.resolve([])),
    enabled: Boolean(sessionId),
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ repositoryId, title }: { repositoryId: string; title?: string }) =>
      api.createSession(repositoryId, title),
    onSuccess: (newSession) => {
      queryClient.setQueryData<ChatSession[]>(
        queryKeys.chat.sessions(newSession.repositoryId),
        (old) => (old ? [newSession, ...old] : [newSession])
      );
    },
    onError: (err: Error) => {
      toast.add({
        title: "Failed to create chat session",
        description: err.message,
        type: "error",
      });
    },
  });
}

export function useSendMessage(sessionId: string | null) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, overrideSessionId?: string) => {
      const targetSessionId = overrideSessionId || sessionId;
      if (!targetSessionId || !content.trim() || isStreaming) return;

      const userOptimisticId = "temp-" + Date.now();
      const optimisticUserMsg: ChatMessage = {
        id: userOptimisticId,
        role: "USER",
        content,
        citations: [],
        createdAt: new Date().toISOString(),
      };

      // Optimistically add user message
      queryClient.setQueryData<ChatMessage[]>(
        queryKeys.chat.messages(targetSessionId),
        (old) => (old ? [...old, optimisticUserMsg] : [optimisticUserMsg])
      );

      setIsStreaming(true);
      setStreamingContent("");
      setStreamingCitations([]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        await api.streamMessage({
          sessionId: targetSessionId,
          content,
          signal: controller.signal,
          onUserMessage: (userMsg) => {
            // Replace optimistic user message with actual from server
            queryClient.setQueryData<ChatMessage[]>(
              queryKeys.chat.messages(targetSessionId),
              (old) =>
                old
                  ? old.map((m) => (m.id === userOptimisticId ? userMsg : m))
                  : [userMsg]
            );
          },
          onCitations: (citations) => {
            setStreamingCitations(citations);
          },
          onChunk: (delta) => {
            setStreamingContent((prev) => prev + delta);
          },
          onDone: (assistantMsg) => {
            // Append assistant message
            queryClient.setQueryData<ChatMessage[]>(
              queryKeys.chat.messages(targetSessionId),
              (old) => {
                const list = old ?? [];
                // Check if already added
                if (list.some((m) => m.id === assistantMsg.id)) {
                  return list;
                }
                return [...list, assistantMsg];
              }
            );
            setIsStreaming(false);
            setStreamingContent("");
            setStreamingCitations([]);
          },
          onError: (err) => {
            setIsStreaming(false);
            setStreamingContent("");
            setStreamingCitations([]);
            toast.add({
              title: "Message failed",
              description: err.message,
              type: "error",
            });
          },
        });
      } catch (err: unknown) {
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingCitations([]);
        if (err instanceof Error && err.name !== "AbortError") {
          toast.add({
            title: "Connection error",
            description: err.message,
            type: "error",
          });
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [sessionId, isStreaming, queryClient]
  );

  return {
    sendMessage,
    abort,
    isStreaming,
    streamingContent,
    streamingCitations,
  };
}
