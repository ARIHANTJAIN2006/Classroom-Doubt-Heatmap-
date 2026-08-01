"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Presentation, RotateCcw } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";
import {
  getLectures,
  getLectureById,
  getTeacherName,
  resetAllMockData,
} from "@/lib/mockApi";
import type { Lecture, SlideAggregate } from "@/lib/types";
import { formatDate, getHeatColor, cn } from "@/lib/utils";

interface LectureRow {
  lecture: Lecture;
  avgIntensity: number;
  totalMarks: number;
}

function confusionLabel(intensity: number): string {
  if (intensity === 0) return "No responses yet";
  if (intensity < 0.35) return "Low confusion";
  if (intensity < 0.65) return "Moderate confusion";
  return "High confusion";
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [teacherName, setTeacherNameState] = useState<string | null>(null);
  const [rows, setRows] = useState<LectureRow[] | null>(null);
  const [resetting, setResetting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadLectures = useCallback(async (name: string) => {
    setLoadError(null);
    try {
      const lectures = await getLectures(name);
      const details = await Promise.all(
        lectures.map((l) => getLectureById(l.id))
      );
      const withStats: LectureRow[] = details.map(({ lecture, aggregates }) => {
        const marks = aggregates.reduce((sum: number, a: SlideAggregate) => sum + a.totalMarks, 0);
        const avg =
          aggregates.length > 0
            ? aggregates.reduce((sum, a) => sum + a.intensity, 0) / aggregates.length
            : 0;
        return { lecture, avgIntensity: avg, totalMarks: marks };
      });
      setRows(withStats);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setLoadError(err instanceof Error ? err.message : "Something went wrong loading your lectures.");
    }
  }, []);

  useEffect(() => {
    getTeacherName().then((name) => {
      if (!name) {
        router.replace("/login");
        return;
      }
      setTeacherNameState(name);
      loadLectures(name);
    });
  }, [router, loadLectures]);

  const handleReset = async () => {
    if (!confirm("Reset all demo data? This clears every lecture and response.")) return;
    setResetting(true);
    await resetAllMockData();
    if (teacherName) await loadLectures(teacherName);
    setResetting(false);
  };

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="font-serif text-lg text-ink">Couldn't load your dashboard</p>
        <p className="max-w-sm text-sm text-ink-muted">{loadError}</p>
        <button
          type="button"
          onClick={() => teacherName && loadLectures(teacherName)}
          className="tap-target rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-dark"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!teacherName || rows === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName={teacherName} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-ink sm:text-3xl">Your lectures</h1>
            <p className="mt-1 text-sm text-ink-muted">
              A quick read on where each class got stuck.
            </p>
          </div>
          <Link
            href="/teacher/upload"
            className="tap-target flex items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            <Plus size={16} />
            Upload new lecture
          </Link>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Presentation size={22} />}
            title="No lectures yet"
            description="Upload the slides you taught today and get a join code students can use to react anonymously."
            action={
              <Link
                href="/teacher/upload"
                className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-dark"
              >
                <Plus size={16} />
                Upload your first lecture
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rows.map(({ lecture, avgIntensity, totalMarks }) => (
              <Link
                key={lecture.id}
                href={`/teacher/lecture/${lecture.id}`}
                className="group rounded-xl border border-line bg-surface p-5 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                      {lecture.subject} · {lecture.unit}
                    </p>
                    <h2 className="mt-0.5 font-serif text-lg text-ink group-hover:text-accent">
                      {lecture.title}
                    </h2>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      lecture.status === "open"
                        ? "bg-accent-soft text-accent"
                        : "bg-surfacemuted text-ink-muted"
                    )}
                  >
                    {lecture.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{formatDate(lecture.date)}</span>
                  <span className="font-mono">{lecture.slideCount} slides</span>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: getHeatColor(avgIntensity) }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-ink-muted">
                    {confusionLabel(avgIntensity)}
                  </span>
                  <span className="ml-auto font-mono text-xs text-ink-faint">
                    {totalMarks} mark{totalMarks === 1 ? "" : "s"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-line px-6 py-5 sm:px-10">
        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 text-xs font-medium text-ink-faint hover:text-heat-red disabled:opacity-50"
        >
          <RotateCcw size={14} />
          {resetting ? "Resetting…" : "Reset demo data"}
        </button>
      </footer>
    </div>
  );
}
