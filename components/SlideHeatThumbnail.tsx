"use client";

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import type { SlideAggregate } from "@/lib/types";
import { getHeatColor, cn } from "@/lib/utils";

interface SlideHeatThumbnailProps {
  aggregate: SlideAggregate;
  onClick?: () => void;
  selected?: boolean;
}

export default function SlideHeatThumbnail({
  aggregate,
  onClick,
  selected = false,
}: SlideHeatThumbnailProps) {
  const heatColor = getHeatColor(aggregate.intensity);
  // Opacity carries the signal, not just hue, so it stays legible even for
  // someone who can't distinguish blue from red.
  const washOpacity = 0.12 + aggregate.intensity * 0.58;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative aspect-video w-full overflow-hidden rounded-lg border bg-surface text-left transition-shadow",
        selected ? "border-accent ring-2 ring-accent/40" : "border-line hover:border-line-strong"
      )}
    >
      <img
        src={aggregate.imageUrl}
        alt={`Slide ${aggregate.index + 1}`}
        className="h-full w-full object-cover"
        draggable={false}
      />

      {/* Heat wash — a soft highlighter-like soak, not a hard color block. */}
      <div
        className="pointer-events-none absolute inset-0 animate-heat-soak mix-blend-multiply"
        style={
          {
            background: `radial-gradient(120% 100% at 50% 100%, ${heatColor} 0%, transparent 70%)`,
            opacity: washOpacity,
            "--heat-target-opacity": washOpacity,
          } as CSSProperties
        }
        aria-hidden="true"
      />

      <div className="absolute bottom-1.5 left-1.5 rounded bg-ink/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
        {aggregate.index + 1}
      </div>

      {aggregate.totalMarks > 0 && (
        <div className="absolute right-1.5 top-1.5 rounded-full bg-white/90 px-2 py-0.5 font-mono text-[10px] font-medium text-ink shadow-sm">
          {aggregate.totalMarks}
        </div>
      )}
    </button>
  );
}
