"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useRepos } from "@/hooks/use-repo";

function ChatRedirectHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoId = searchParams.get("repo");
  const { data: repos = [], isLoading } = useRepos();

  useEffect(() => {
    if (repoId) {
      router.replace(`/chat/${repoId}`);
      return;
    }

    if (!isLoading) {
      const readyRepo = repos.find((r) => r.indexStatus === "READY");
      if (readyRepo) {
        router.replace(`/chat/${readyRepo.id}`);
      } else {
        router.replace("/dashboard");
      }
    }
  }, [repoId, repos, isLoading, router]);

  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function ChatFallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChatRedirectHandler />
    </Suspense>
  );
}
