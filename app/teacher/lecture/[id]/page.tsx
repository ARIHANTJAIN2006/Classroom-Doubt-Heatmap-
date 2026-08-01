"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import SlideHeatThumbnail from "@/components/SlideHeatThumbnail";
import SlideDetailPanel from "@/components/SlideDetailPanel";
import HeatLegend from "@/components/HeatLegend";
import {
  getLectureById,
  getTeacherName,
  seedRandomMarks,
  setLectureStatus,
} from "@/lib/mockApi";
import type { Lecture, SlideAggregate } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";

export default function TeacherLecturePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [teacherName, setTeacherNameState] = useState<string | null>(null);
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [aggregates, setAggregates] = useState<SlideAggregate[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const load = useCallback(async () => {
    const { lecture, aggregates } = await getLectureById(params.id);
    setLecture(lecture);
    setAggregates(aggregates);
  }, [params.id]);

  useEffect(() => {
    getTeacherName().then((name) => {
      if (!name) {
        router.replace("/login");
        return;
      }
      setTeacherNameState(name);
    });
    load();
  }, [load, router]);

  const handleSimulate = async () => {
    if (!lecture) return;
    setSimulating(true);
    await seedRandomMarks(lecture.id, 12);
    await load();
    setSimulating(false);
  };

  const handleToggleStatus = async () => {
    if (!lecture) return;
    setTogglingStatus(true);
    const next = lecture.status === "open" ? "closed" : "open";
    await setLectureStatus(lecture.id, next);
    await load();
    setTogglingStatus(false);
  };

  if (!teacherName || !lecture) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Loading lecture…
      </div>
    );
  }

  const ranked = [...aggregates]
    .filter((a) => a.totalMarks > 0)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 5);
  const selected = aggregates.find((a) => a.slideId === selectedSlideId) ?? null;

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName={teacherName} />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              {lecture.subject} · {lecture.unit} · {formatDate(lecture.date)}
            </p>
            <h1 className="mt-0.5 font-serif text-2xl text-ink sm:text-3xl">{lecture.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSimulate}
              disabled={simulating}
              className="tap-target flex items-center gap-2 rounded-full border border-accent-soft-strong bg-accent-soft px-4 text-sm font-medium text-accent hover:bg-accent-soft-strong disabled:opacity-50"
            >
              <Sparkles size={15} />
              {simulating ? "Simulating…" : "Simulate student responses"}
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={cn(
                "tap-target rounded-full border px-4 text-sm font-medium disabled:opacity-50",
                lecture.status === "open"
                  ? "border-line text-ink-muted hover:bg-surfacemuted"
                  : "border-accent bg-accent text-white hover:bg-accent-dark"
              )}
            >
              {lecture.status === "open" ? "Close review window" : "Reopen review window"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <HeatLegend />
              <span className="font-mono text-xs text-ink-faint">
                {aggregates.reduce((s, a) => s + a.totalMarks, 0)} total marks
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {aggregates.map((agg) => (
                <SlideHeatThumbnail
                  key={agg.slideId}
                  aggregate={agg}
                  selected={agg.slideId === selectedSlideId}
                  onClick={() => setSelectedSlideId(agg.slideId)}
                />
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-6">
            <div>
              <h2 className="mb-3 font-serif text-lg text-ink">Most confusing slides</h2>
              <ol className="flex flex-col gap-2">
                {ranked.map((a, i) => (
                  <li key={a.slideId}>
                    <button
                      type="button"
                      onClick={() => setSelectedSlideId(a.slideId)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                        a.slideId === selectedSlideId
                          ? "border-accent bg-accent-soft"
                          : "border-line bg-surface hover:border-line-strong"
                      )}
                    >
                      <span className="font-mono text-xs text-ink-faint">{i + 1}</span>
                      <span className="flex-1 text-ink">Slide {a.index + 1}</span>
                      <span className="font-mono text-xs text-ink-muted">{a.totalMarks}</span>
                    </button>
                  </li>
                ))}
                {ranked.length === 0 && (
                  <p className="text-sm text-ink-faint">No responses yet.</p>
                )}
              </ol>
            </div>

            {selected && (
              <SlideDetailPanel aggregate={selected} onClose={() => setSelectedSlideId(null)} />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
