"use client";

import { cn } from "@/lib/utils";

interface ProgressDotsProps {
  total: number;
  currentIndex: number;
  reactedIndexes: Set<number>;
  onSelect?: (index: number) => void;
}

export default function ProgressDots({
  total,
  currentIndex,
  reactedIndexes,
  onSelect,
}: ProgressDotsProps) {
  return (
    <div
      className="flex w-full items-center gap-1.5 overflow-x-auto px-1 py-1"
      role="tablist"
      aria-label="Slide progress"
    >
      {Array.from({ length: total }, (_, i) => {
        const isCurrent = i === currentIndex;
        const reacted = reactedIndexes.has(i);
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isCurrent}
            aria-label={`Slide ${i + 1}${reacted ? ", reacted" : ""}`}
            onClick={() => onSelect?.(i)}
            className={cn(
              "h-1.5 flex-1 min-w-[10px] rounded-full transition-all duration-200",
              isCurrent
                ? "bg-accent"
                : reacted
                ? "bg-accent-soft-strong"
                : "bg-line"
            )}
          />
        );
      })}
    </div>
  );
}
