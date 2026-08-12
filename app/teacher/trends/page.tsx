"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart as LineChartIcon } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";
import { ApiError, getTrends } from "@/lib/api";
import { computeTopicConsistency, formatShortDate } from "@/lib/utils";
import type { TrendPoint } from "@/lib/types";

const TREND_LABEL: Record<string, string> = {
  rising: "Rising",
  stable: "Stable",
  falling: "Falling",
};

export default function TrendsPage() {
  const router = useRouter();
  const [points, setPoints] = useState<TrendPoint[] | null>(null);

  useEffect(() => {
    getTrends()
      .then(setPoints)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setPoints([]);
      });
  }, [router]);

  const consistency = points ? computeTopicConsistency(points) : [];
  const chartData = points
    ? [...points]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((p) => ({ date: formatShortDate(p.date), confusionRate: Math.round(p.confusionRate * 100), title: p.title }))
    : [];

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Semester trends</h1>
        <p className="mb-6 text-sm text-ink-muted">Confusion rate across all of your lectures.</p>

        {points && points.length === 0 && (
          <EmptyState
            icon={<LineChartIcon size={22} />}
            title="No trends to show yet"
            description="Upload a lecture and collect student marks to build trend charts."
          />
        )}

        {points && points.length > 0 && (
          <>
            <div className="mb-8 h-64 rounded-2xl border border-line bg-surface p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" fontSize={12} stroke="#9CA3AF" />
                  <YAxis fontSize={12} stroke="#9CA3AF" unit="%" width={40} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Confusion rate"]} />
                  <Line type="monotone" dataKey="confusionRate" stroke="#D6432F" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {consistency.length > 0 && (
              <>
                <h2 className="mb-3 font-serif text-lg text-ink">Recurring trouble spots</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {consistency.map((c) => (
                    <div key={`${c.subject}-${c.topic}`} className="rounded-xl border border-line bg-surface p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-ink">{c.topic}</p>
                        <span className="rounded-full bg-surfacemuted px-2 py-0.5 text-xs text-ink-faint">
                          {TREND_LABEL[c.trend]}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-faint">
                        {c.subject} · {c.lectureCount} lectures · avg {Math.round(c.avgConfusionRate * 100)}%
                        confusion
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
