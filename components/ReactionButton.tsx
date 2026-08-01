"use client";

import { Frown, Gauge, Star } from "lucide-react";
import type { ReactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<ReactionType, typeof Frown> = {
  confused: Frown,
  too_fast: Gauge,
  important: Star,
};

interface ReactionButtonProps {
  reaction: ReactionType;
  label: string;
  active: boolean;
  onClick: () => void;
  size?: "md" | "lg";
  disabled?: boolean;
}

export default function ReactionButton({
  reaction,
  label,
  active,
  onClick,
  size = "md",
  disabled = false,
}: ReactionButtonProps) {
  const Icon = ICONS[reaction];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "tap-target flex flex-col items-center justify-center gap-1.5 rounded-2xl border transition-colors duration-150",
        size === "lg" ? "px-4 py-4" : "px-3 py-2.5",
        active
          ? "border-accent bg-accent text-white shadow-sm"
          : "border-line bg-surface text-ink-muted hover:border-accent-soft-strong hover:bg-accent-soft",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon size={size === "lg" ? 26 : 20} strokeWidth={2} />
      <span className={cn("font-medium", size === "lg" ? "text-sm" : "text-xs")}>
        {label}
      </span>
    </button>
  );
}
