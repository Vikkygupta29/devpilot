
export type IndexStatus = "PENDING" | "INDEXING" | "READY" | "FAILED";

export type IndexStatusResponse = {
  repositoryId: string;
  indexStatus: IndexStatus;
  filesTotal: number;
  filesProcessed: number;
  chunkCount: number;
  indexedAt: string | null;
  errorMessage: string | null;
};

export type Repository = {
  id: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  language: string | null;
  htmlUrl: string | null;
  description: string | null;
  indexStatus: IndexStatus;
  indexedAt: string | null;
  chunkCount: number;
  filesTotal: number;
  filesProcessed: number;
  errorMessage: string | null;
};

export type ChatSession = {
  id: string;
  repositoryId: string;
    title: string;
    createdAt: string;
}

export type Citation = {
  filePath: string;
  startLine: number | null;
  endLine: number | null;
  language: string | null;
};

export type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  citations: Citation[];
  createdAt: string;
};


export type User = {
    id: string;
    githubId: number;
    githubUsername: string;
    displayName: string;
    avatarUrl: string | null;
};


export function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
}

export function getGitHubLoginurl() {
    return `${getApiBaseUrl()}/oauth2/authorization/github`;
}

export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.status = status;
    }

}


async function parseError(res: Response): Promise<string> {

    try {
        const data = await res.json();
        return data.message ??  data.error ?? res.statusText;
    } catch{
          return res.statusText || "Request failed";
    }
    
}


export async function apiFetch<T>(
    path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
        ...init,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {}),
        },
    });


    if(!res.ok)
    {
        throw new ApiError(await parseError(res), res.status);
    }

    if(res.status === 204) {
        return undefined as T;
    }


    return res.json() as Promise<T>;

}


export const api ={
    me: ()=> apiFetch<User>("/api/auth/me"),
    logout: ()=> apiFetch<void>("/api/auth/logout", { method: "POST" }),

   
    listRepos: (refresh = true)=> apiFetch<Repository[]>(`/api/repos?refresh=${refresh}`),

        getRepo: (id: string) => apiFetch<Repository>(`/api/repos/${id}`),

        startIndex: (id: string) => apiFetch<Repository>(`/api/repos/${id}/index`, { method: "POST" }),

        indexStatus: (id: string) => apiFetch<IndexStatusResponse>(`/api/repos/${id}/status`),

        createSession: (repositoryId: string, title?: string) =>
  apiFetch<ChatSession>("/api/chat/sessions", {
    method: "POST",
    body: JSON.stringify({ repositoryId, title }),
  }),

listSessions: (repositoryId: string) =>
  apiFetch<ChatSession[]>(
    `/api/chat/sessions?repositoryId=${encodeURIComponent(repositoryId)}`
  ),

  getMessages: (sessionId: string) =>
    apiFetch<ChatMessage[]>(`/api/chat/sessions/${sessionId}`),

  streamMessage: async ({
    sessionId,
    content,
    signal,
    onUserMessage,
    onCitations,
    onChunk,
    onDone,
    onError,
  }: {
    sessionId: string;
    content: string;
    signal?: AbortSignal;
    onUserMessage?: (msg: ChatMessage) => void;
    onCitations?: (citations: Citation[]) => void;
    onChunk?: (delta: string) => void;
    onDone?: (msg: ChatMessage) => void;
    onError?: (err: Error) => void;
  }): Promise<void> => {
    const res = await fetch(`${getApiBaseUrl()}/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ content }),
      signal,
    });

    if (!res.ok) {
      const errText = await parseError(res);
      const err = new ApiError(errText, res.status);
      onError?.(err);
      throw err;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";
    let currentData = "";

    const dispatchEvent = (event: string, data: string) => {
      if (!data) return;
      try {
        const parsed = JSON.parse(data);
        if (event === "user_message") {
          onUserMessage?.(parsed);
        } else if (event === "citations") {
          onCitations?.(parsed);
        } else if (event === "chunk") {
          onChunk?.(parsed.delta ?? "");
        } else if (event === "done") {
          onDone?.(parsed);
        } else if (event === "error") {
          onError?.(new Error(parsed.message || "Streaming error"));
        }
      } catch {
        // Fallback for raw text chunks
        if (event === "chunk") {
          onChunk?.(data);
        }
      }
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            const lines = buffer.split("\n");
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("event:")) {
                currentEvent = trimmed.slice(6).trim();
              } else if (trimmed.startsWith("data:")) {
                currentData = currentData
                  ? currentData + "\n" + trimmed.slice(5).trim()
                  : trimmed.slice(5).trim();
              }
            }
          }
          if (currentData) {
            dispatchEvent(currentEvent || "chunk", currentData);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            if (currentData) {
              dispatchEvent(currentEvent, currentData);
              currentEvent = "";
              currentData = "";
            }
            continue;
          }

          if (trimmed.startsWith("event:")) {
            currentEvent = trimmed.slice(6).trim();
          } else if (trimmed.startsWith("data:")) {
            currentData = currentData
              ? currentData + "\n" + trimmed.slice(5).trim()
              : trimmed.slice(5).trim();
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

