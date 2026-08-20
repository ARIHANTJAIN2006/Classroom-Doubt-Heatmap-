"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Presentation } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";
import { getHeatmap, type Heatmap } from "@/lib/api";

// Interpolates the design system's reserved heat scale (cool -> amber -> red) by confusion rate.
function heatColor(rate: number): string {
  const cool = [62, 124, 177];
  const amber = [232, 163, 61];
  const red = [214, 67, 47];

  const [from, to, t] = rate <= 0.5 ? [cool, amber, rate / 0.5] : [amber, red, (rate - 0.5) / 0.5];
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${mix.join(",")})`;
}

// Higher confusion = a darker, higher-contrast overlay so the most-confusing
// slides visually pop out of the grid; low-confusion slides stay a light wash.
function heatOpacity(rate: number, totalMarks: number): number {
  if (totalMarks === 0) return 0;
  const MIN_OPACITY = 0.15;
  const MAX_OPACITY = 0.75;
  return MIN_OPACITY + rate * (MAX_OPACITY - MIN_OPACITY);
}

export default function TeacherLecturePage() {
  const { id } = useParams<{ id: string }>();
  const [heatmap, setHeatmap] = useState<Heatmap | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function refresh(isInitialLoad: boolean) {
      getHeatmap(id)
        .then((data) => {
          if (!cancelled) setHeatmap(data);
        })
        .catch(() => {
          // Only the initial load shows an error state — a transient failure on a
          // background refresh just keeps the last good data on screen instead of
          // wiping it out every 10s.
          if (!cancelled && isInitialLoad) setLoadError(true);
        });
    }

    refresh(true);
    const intervalId = setInterval(() => refresh(false), 10_000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [id]);

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-10">
        {loadError && (
          <EmptyState
            icon={<Presentation size={22} />}
            title="Lecture not found"
            description="Check the link your teacher dashboard gave you, or seed demo data to try this page."
          />
        )}

        {!loadError && !heatmap && (
          <p className="text-sm text-ink-muted">Loading heatmap…</p>
        )}

        {heatmap && (
          <>
            <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">{heatmap.lectureName}</h1>
            <p className="mb-8 text-sm text-ink-muted">
              Confusion heatmap across {heatmap.slides.length} slide
              {heatmap.slides.length === 1 ? "" : "s"}.
            </p>

            <div className="mb-10 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmap.slides}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D8DEDA" />
                  <XAxis dataKey="slideNumber" tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    domain={[0, 1]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(v: number) => `${Math.round(v * 100)}% confusing`} />
                  <Bar dataKey="confusionRate" radius={[4, 4, 0, 0]}>
                    {heatmap.slides.map((s) => (
                      <Cell key={s.slideId} fill={heatColor(s.confusionRate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {heatmap.slides.map((s) => (
                <div key={s.slideId} className="overflow-hidden rounded-xl border border-line bg-surface">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.imageUrl} alt={`Slide ${s.slideNumber}`} className="w-full" />
                    <div
                      className="absolute inset-0 animate-heat-soak"
                      style={{
                        backgroundImage: `linear-gradient(to top, ${heatColor(s.confusionRate)}, transparent 85%)`,
                        // @ts-expect-error custom property consumed by the heat-soak keyframes
                        "--heat-target-opacity": heatOpacity(s.confusionRate, s.totalMarks),
                      }}
                    />
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-ink">Slide {s.slideNumber}</p>
                    <p className="font-mono text-xs text-ink-muted">
                      {s.totalMarks === 0
                        ? "No marks yet"
                        : `${Math.round(s.confusionRate * 100)}% confusing · ${s.totalMarks} mark${s.totalMarks === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
