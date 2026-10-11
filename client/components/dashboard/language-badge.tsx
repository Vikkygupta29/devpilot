"use client";

import React from "react";
import { Code2 } from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiC,
  SiCplusplus,
  SiClojure,
  SiCss,
  SiDart,
  SiDocker,
  SiElixir,
  SiGo,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiJupyter,
  SiKotlin,
  SiLua,
  SiMarkdown,
  SiPhp,
  SiPython,
  SiR,
  SiRuby,
  SiRust,
  SiScala,
  SiSwift,
  SiTypescript,
  SiYaml,
  SiZig,
} from "react-icons/si";
import { FaJava } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type LanguageConfig = {
  Icon: IconType;
  bg: string;
  iconClass: string;
  name: string;
};

const LANGUAGE_MAP: Record<string, LanguageConfig> = {
  javascript: {
    Icon: SiJavascript,
    bg: "bg-[#F7DF1E]",
    iconClass: "text-[#1e1e1e]",
    name: "JavaScript",
  },
  typescript: {
    Icon: SiTypescript,
    bg: "bg-[#3178C6]",
    iconClass: "text-white",
    name: "TypeScript",
  },
  python: {
    Icon: SiPython,
    bg: "bg-[#3776AB]",
    iconClass: "text-[#FFD43B]",
    name: "Python",
  },
  java: {
    Icon: FaJava,
    bg: "bg-[#E76F00]",
    iconClass: "text-white",
    name: "Java",
  },
  c: {
    Icon: SiC,
    bg: "bg-[#555555]",
    iconClass: "text-[#A8B9CC]",
    name: "C",
  },
  "c++": {
    Icon: SiCplusplus,
    bg: "bg-[#00599C]",
    iconClass: "text-white",
    name: "C++",
  },
  cpp: {
    Icon: SiCplusplus,
    bg: "bg-[#00599C]",
    iconClass: "text-white",
    name: "C++",
  },
  go: {
    Icon: SiGo,
    bg: "bg-[#00ADD8]",
    iconClass: "text-white",
    name: "Go",
  },
  rust: {
    Icon: SiRust,
    bg: "bg-[#DEA584]",
    iconClass: "text-black",
    name: "Rust",
  },
  ruby: {
    Icon: SiRuby,
    bg: "bg-[#CC342D]",
    iconClass: "text-white",
    name: "Ruby",
  },
  php: {
    Icon: SiPhp,
    bg: "bg-[#777BB4]",
    iconClass: "text-white",
    name: "PHP",
  },
  html: {
    Icon: SiHtml5,
    bg: "bg-[#E34F26]",
    iconClass: "text-white",
    name: "HTML",
  },
  html5: {
    Icon: SiHtml5,
    bg: "bg-[#E34F26]",
    iconClass: "text-white",
    name: "HTML5",
  },
  css: {
    Icon: SiCss,
    bg: "bg-[#1572B6]",
    iconClass: "text-white",
    name: "CSS",
  },
  "jupyter notebook": {
    Icon: SiJupyter,
    bg: "bg-[#F37626]",
    iconClass: "text-white",
    name: "Jupyter Notebook",
  },
  jupyter: {
    Icon: SiJupyter,
    bg: "bg-[#F37626]",
    iconClass: "text-white",
    name: "Jupyter Notebook",
  },
  kotlin: {
    Icon: SiKotlin,
    bg: "bg-[#7F52FF]",
    iconClass: "text-white",
    name: "Kotlin",
  },
  swift: {
    Icon: SiSwift,
    bg: "bg-[#F05138]",
    iconClass: "text-white",
    name: "Swift",
  },
  dart: {
    Icon: SiDart,
    bg: "bg-[#0175C2]",
    iconClass: "text-white",
    name: "Dart",
  },
  dockerfile: {
    Icon: SiDocker,
    bg: "bg-[#2496ED]",
    iconClass: "text-white",
    name: "Docker",
  },
  markdown: {
    Icon: SiMarkdown,
    bg: "bg-[#083fa1]",
    iconClass: "text-white",
    name: "Markdown",
  },
  json: {
    Icon: SiJson,
    bg: "bg-[#292929]",
    iconClass: "text-[#F7DF1E]",
    name: "JSON",
  },
  yaml: {
    Icon: SiYaml,
    bg: "bg-[#CB171E]",
    iconClass: "text-white",
    name: "YAML",
  },
  shell: {
    Icon: Code2,
    bg: "bg-[#89e051]",
    iconClass: "text-black",
    name: "Shell",
  },
  lua: {
    Icon: SiLua,
    bg: "bg-[#000080]",
    iconClass: "text-white",
    name: "Lua",
  },
  scala: {
    Icon: SiScala,
    bg: "bg-[#DC322F]",
    iconClass: "text-white",
    name: "Scala",
  },
  elixir: {
    Icon: SiElixir,
    bg: "bg-[#4E2A8E]",
    iconClass: "text-white",
    name: "Elixir",
  },
  haskell: {
    Icon: SiHaskell,
    bg: "bg-[#5D4F85]",
    iconClass: "text-white",
    name: "Haskell",
  },
  zig: {
    Icon: SiZig,
    bg: "bg-[#F7A41D]",
    iconClass: "text-black",
    name: "Zig",
  },
  clojure: {
    Icon: SiClojure,
    bg: "bg-[#5881D8]",
    iconClass: "text-white",
    name: "Clojure",
  },
  r: {
    Icon: SiR,
    bg: "bg-[#276DC3]",
    iconClass: "text-white",
    name: "R",
  },
};

function getLanguageConfig(language?: string | null): LanguageConfig | null {
  if (!language) return null;
  const key = language.toLowerCase().trim();
  return LANGUAGE_MAP[key] ?? null;
}

export function LanguageBadge({
  language,
  className,
}: {
  language?: string | null;
  className?: string;
}) {
  const config = getLanguageConfig(language);

  if (!config) {
    return (
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 font-semibold text-xs shrink-0 shadow-sm border border-zinc-700/50",
          className
        )}
      >
        <Code2 className="size-5" />
      </div>
    );
  }

  const { Icon, bg, iconClass } = config;

  return (
    <div
      className={cn(
        "flex size-10 items-center justify-center rounded-xl shadow-sm shrink-0 font-bold",
        bg,
        className
      )}
    >
      <Icon className={cn("size-5", iconClass)} />
    </div>
  );
}

export function LanguageTag({
  language,
  className,
}: {
  language?: string | null;
  className?: string;
}) {
  if (!language) return null;
  const config = getLanguageConfig(language);
  const Icon = config?.Icon ?? Code2;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-muted/60 text-muted-foreground border border-border/50",
        className
      )}
    >
      <div
        className={cn(
          "flex size-3.5 items-center justify-center rounded-xs",
          config ? config.bg : "bg-muted"
        )}
      >
        <Icon
          className={cn("size-2.5", config ? config.iconClass : "text-muted-foreground")}
        />
      </div>
      <span>{config?.name ?? language}</span>
    </div>
  );
}
