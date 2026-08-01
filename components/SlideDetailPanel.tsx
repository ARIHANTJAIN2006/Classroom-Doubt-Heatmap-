"use client";

/* eslint-disable @next/next/no-img-element */
import { X } from "lucide-react";
import type { SlideAggregate } from "@/lib/types";
import { REACTION_LABELS, REACTION_TYPES } from "@/lib/types";
import { getHeatColor } from "@/lib/utils";

interface SlideDetailPanelProps {
  aggregate: SlideAggregate;
  onClose: () => void;
}

export default function SlideDetailPanel({ aggregate, onClose }: SlideDetailPanelProps) {
  const maxCount = Math.max(1, ...REACTION_TYPES.map((r) => aggregate.breakdown[r]));

  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm animate-fade-up">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-ink-faint">
            Slide {aggregate.index + 1}
          </p>
          <p className="font-serif text-lg text-ink">
            {aggregate.totalMarks} response{aggregate.totalMarks === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close slide detail"
          className="tap-target flex items-center justify-center rounded-full text-ink-muted hover:bg-accent-soft hover:text-accent"
        >
          <X size={18} />
        </button>
      </div>

      <img
        src={aggregate.imageUrl}
        alt={`Slide ${aggregate.index + 1}`}
        className="mb-4 w-full rounded-lg border border-line"
      />

      <div className="space-y-3">
        {REACTION_TYPES.map((reaction) => {
          const count = aggregate.breakdown[reaction];
          const width = (count / maxCount) * 100;
          return (
            <div key={reaction}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-ink-muted">{REACTION_LABELS[reaction]}</span>
                <span className="font-mono text-ink">{count}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surfacemuted">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${width}%`,
                    backgroundColor:
                      reaction === "important" ? "#2F6F4F" : getHeatColor(aggregate.intensity),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
