"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingDown, TrendingUp, Minus, LineChart as LineChartIcon } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import TrendChart from "@/components/TrendChart";
import EmptyState from "@/components/EmptyState";
import { getLectures, getSemesterTrends, getTeacherName } from "@/lib/mockApi";
import type { Lecture, TrendPoint } from "@/lib/types";
import { computeTopicConsistency, cn } from "@/lib/utils";

const TREND_ICON = {
  rising: TrendingUp,
  falling: TrendingDown,
  stable: Minus,
} as const;

export default function TrendsPage() {
  const router = useRouter();
  const [teacherName, setTeacherNameState] = useState<string | null>(null);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [points, setPoints] = useState<TrendPoint[] | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [unitFilter, setUnitFilter] = useState<string>("");

  const loadTrends = useCallback(
    async (name: string, subject: string, unit: string) => {
      const data = await getSemesterTrends(name, {
        subject: subject || undefined,
        unit: unit || undefined,
      });
      setPoints(data);
    },
    []
  );

  useEffect(() => {
    getTeacherName().then(async (name) => {
      if (!name) {
        router.replace("/login");
        return;
      }
      setTeacherNameState(name);
      const lectures = await getLectures(name);
      setAllLectures(lectures);
      await loadTrends(name, "", "");
    });
  }, [router, loadTrends]);

  useEffect(() => {
    if (teacherName) void loadTrends(teacherName, subjectFilter, unitFilter);
  }, [subjectFilter, unitFilter, teacherName, loadTrends]);

  const subjects = useMemo(
    () => Array.from(new Set(allLectures.map((l) => l.subject))).sort(),
    [allLectures]
  );
  const units = useMemo(
    () =>
      Array.from(
        new Set(
          allLectures
            .filter((l) => !subjectFilter || l.subject === subjectFilter)
            .map((l) => l.unit)
        )
      ).sort(),
    [allLectures, subjectFilter]
  );

  const consistency = useMemo(
    () => (points ? computeTopicConsistency(points) : []),
    [points]
  );

  if (!teacherName || points === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Loading trends…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName={teacherName} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Semester trends</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Confusion rate across lectures, and topics that keep coming back.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setUnitFilter("");
            }}
            className="tap-target rounded-lg border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">All subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="tap-target rounded-lg border border-line bg-white px-3 text-sm text-ink"
          >
            <option value="">All units</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {points.length === 0 ? (
          <EmptyState
            icon={<LineChartIcon size={22} />}
            title="Nothing to show yet"
            description="Once you've taught a few lectures with this filter, their confusion rate will show up here."
          />
        ) : (
          <>
            <div className="mb-10 rounded-xl border border-line bg-surface p-5">
              <TrendChart points={points} />
            </div>

            <h2 className="mb-3 font-serif text-lg text-ink">Consistently confusing topics</h2>
            {consistency.length === 0 ? (
              <p className="text-sm text-ink-faint">
                No topic has repeated across multiple lectures yet with this filter — nothing
                to rank until the same topic comes up more than once.
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {consistency.map((t, i) => {
                  const Icon = TREND_ICON[t.trend];
                  return (
                    <li
                      key={`${t.subject}-${t.topic}`}
                      className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3"
                    >
                      <span className="font-mono text-xs text-ink-faint">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-ink">{t.topic}</p>
                        <p className="text-xs text-ink-muted">
                          {t.subject} · across {t.lectureCount} lectures
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex items-center gap-1 text-xs font-medium",
                          t.trend === "rising"
                            ? "text-heat-red"
                            : t.trend === "falling"
                            ? "text-accent"
                            : "text-ink-faint"
                        )}
                      >
                        <Icon size={14} />
                        {Math.round(t.avgConfusionRate * 100)}%
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </>
        )}
      </main>
    </div>
  );
}
