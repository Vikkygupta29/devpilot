"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const toggleTheme = () => {
    const current = resolvedTheme || theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className ?? "size-9 rounded-lg text-muted-foreground hover:bg-muted/50"}
        aria-label="Toggle theme"
      >
        <Moon className="size-4" />
      </Button>
    );
  }

  const isDark = (resolvedTheme || theme) === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className ?? "size-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"}
      aria-label="Toggle theme"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-400 transition-all duration-200" />
      ) : (
        <Moon className="size-4.5 text-zinc-700 dark:text-zinc-300 transition-all duration-200" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
