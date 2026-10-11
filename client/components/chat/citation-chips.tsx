"use client";

import { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import type { Citation } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CitationChips({ citations }: { citations?: Citation[] }) {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  if (!citations || citations.length === 0) return null;

  const handleCopy = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <TooltipProvider delay={150}>
      <div className="flex flex-wrap items-center gap-1.5 pt-2">
        <span className="text-xs font-medium text-muted-foreground mr-1">
          Sources:
        </span>
        {citations.map((citation, index) => {
          const fileName = citation.filePath?.split("/").pop() ?? citation.filePath;
          const lineInfo =
            citation.startLine != null && citation.endLine != null
              ? `:${citation.startLine}-${citation.endLine}`
              : citation.startLine != null
              ? `:${citation.startLine}`
              : "";
          const isCopied = copiedPath === citation.filePath;

          return (
            <Tooltip key={index}>
              <TooltipTrigger
                render={
                  <Badge
                    variant="outline"
                    onClick={() => citation.filePath && handleCopy(citation.filePath)}
                    className="cursor-pointer gap-1.5 py-1 px-2.5 text-xs font-normal border-primary/20 bg-background hover:bg-muted/80 transition-colors shadow-xs"
                  />
                }
              >
                <FileCode2 className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono font-medium max-w-[140px] truncate">
                  {fileName}
                </span>
                {lineInfo && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {lineInfo}
                  </span>
                )}
                {isCopied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3 text-muted-foreground opacity-50 hover:opacity-100" />
                )}
              </TooltipTrigger>
              <TooltipContent side="top" className="font-mono text-xs max-w-xs break-all">
                {citation.filePath}
                <div className="text-[10px] text-muted-foreground font-sans mt-0.5">
                  Click to copy path
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
