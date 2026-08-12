"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import GridOverlay from "@/components/GridOverlay";
import { ApiError, getStudentSlides, joinLecture, resolveImageUrl, setMarks } from "@/lib/api";
import type { GridCell, Slide } from "@/lib/types";

export default function StudentViewPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;
  const router = useRouter();

  const [gridRows, setGridRows] = useState(0);
  const [gridCols, setGridCols] = useState(0);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [marksBySlide, setMarksBySlide] = useState<Record<string, GridCell[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    joinLecture(code).catch(() => {
      // Registering the join is best-effort here; /join already does this on the normal path.
    });
    getStudentSlides(code)
      .then((data) => {
        setGridRows(data.gridRows);
        setGridCols(data.gridCols);
        setSlides(data.slides);
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Couldn't load this lecture.");
      });
  }, [code]);

  const currentSlide = slides?.[index] ?? null;
  const currentCells = useMemo(
    () => (currentSlide ? marksBySlide[currentSlide.id] ?? [] : []),
    [currentSlide, marksBySlide]
  );

  async function toggleCell(cell: GridCell) {
    if (!currentSlide) return;
    const exists = currentCells.some((c) => c.row === cell.row && c.col === cell.col);
    const nextCells = exists
      ? currentCells.filter((c) => !(c.row === cell.row && c.col === cell.col))
      : [...currentCells, cell];

    setMarksBySlide((prev) => ({ ...prev, [currentSlide.id]: nextCells }));
    setSaving(true);
    try {
      await setMarks(code, currentSlide.id, nextCells);
    } catch {
      // Local selection still reflects intent; a later retry (e.g. next toggle) will resync.
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Lock className="mb-3 text-ink-faint" size={28} />
        <h1 className="font-serif text-xl text-ink">{error}</h1>
        <Link href="/join" className="tap-target mt-6 rounded-full bg-accent px-5 text-sm font-medium text-white">
          Back to join page
        </Link>
      </main>
    );
  }

  if (!slides) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-sm text-ink-muted">
        Loading slides...
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{code}</span>
        <span className="text-xs text-ink-faint">
          Slide {index + 1} of {slides.length}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-8">
        {currentSlide ? (
          <div className="relative w-full overflow-hidden rounded-xl border border-line bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={resolveImageUrl(currentSlide.imageUrl)} alt={`Slide ${index + 1}`} className="block w-full" />
            <GridOverlay rows={gridRows} cols={gridCols} selected={currentCells} onToggle={toggleCell} />
          </div>
        ) : (
          <p className="text-sm text-ink-muted">This lecture has no slides yet.</p>
        )}

        <p className="mt-4 text-center text-xs text-ink-faint">
          Tap the area you&apos;re confused about. Tap again to unmark it.
          {saving && " Saving..."}
        </p>

        <div className="mt-6 flex w-full items-center justify-between">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="tap-target flex items-center gap-1 rounded-full border border-line px-4 text-sm font-medium text-ink disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {index < slides.length - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(slides.length - 1, i + 1))}
              className="tap-target flex items-center gap-1 rounded-full bg-accent px-4 text-sm font-medium text-white"
            >
              Next
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/lecture/${code}/done`)}
              className="tap-target rounded-full bg-accent px-5 text-sm font-medium text-white"
            >
              Finish
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
