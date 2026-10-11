"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { data: user, isLoading, isFetched, refetch } = useCurrentUser();
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace("/dashboard");
      return;
    }

    // Allow slight cookie arrival latency: retry up to 3 times before redirecting to login
    if (retries < 3) {
      const timer = setTimeout(() => {
        setRetries((prev) => prev + 1);
        void refetch();
      }, 500);
      return () => clearTimeout(timer);
    }

    if (isFetched && !user) {
      router.replace("/login?error=session");
    }
  }, [user, isLoading, isFetched, router, retries, refetch]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background">
      <Spinner className="size-7 text-primary" />
      <p className="text-sm text-muted-foreground font-medium">Finishing GitHub sign-in...</p>
    </div>
  );
}