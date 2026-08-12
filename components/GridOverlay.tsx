"use client";

import { cn, getHeatColor } from "@/lib/utils";
import type { GridCell, HeatmapCell } from "@/lib/types";

interface GridOverlayProps {
  rows: number;
  cols: number;
  /** Interactive mode: cells the current student has marked. */
  selected?: GridCell[];
  onToggle?: (cell: GridCell) => void;
  /** Read-only mode: aggregated counts/intensity per cell for the teacher heatmap. */
  heatmapCells?: HeatmapCell[];
  readOnly?: boolean;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export default function GridOverlay({ rows, cols, selected, onToggle, heatmapCells, readOnly }: GridOverlayProps) {
  const selectedSet = new Set((selected ?? []).map((c) => cellKey(c.row, c.col)));
  const heatmapMap = new Map((heatmapCells ?? []).map((c) => [cellKey(c.row, c.col), c]));

  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const key = cellKey(row, col);
      const heat = heatmapMap.get(key);
      const isSelected = selectedSet.has(key);

      cells.push(
        <button
          key={key}
          type="button"
          disabled={readOnly}
          aria-label={`Row ${row + 1}, column ${col + 1}${heat ? `, ${heat.count} mark${heat.count === 1 ? "" : "s"}` : ""}`}
          title={heat ? `${heat.count} mark${heat.count === 1 ? "" : "s"}` : undefined}
          onClick={() => onToggle?.({ row, col })}
          className={cn(
            "border border-white/10 transition-colors",
            !readOnly && "cursor-pointer hover:bg-accent/20",
            readOnly && "cursor-default"
          )}
          style={{
            gridRow: row + 1,
            gridColumn: col + 1,
            backgroundColor: heat
              ? getHeatColor(heat.intensity)
              : isSelected
                ? "rgba(232, 163, 61, 0.5)"
                : "transparent",
            opacity: heat ? Math.max(heat.intensity, 0.15) : 1,
          }}
        />
      );
    }
  }

  return (
    <div
      className="absolute inset-0 grid select-none"
      style={{ gridTemplateRows: `repeat(${rows}, 1fr)`, gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {cells}
    </div>
  );
}
