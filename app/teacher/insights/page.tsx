"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Presentation, RefreshCw, Sparkles } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";
import { getLectureInsights, type FlaggedSlide, type LectureInsights } from "@/lib/api";

interface LectureSummary {
  id: string;
  name: string;
  topic: string;
  semester: number;
  year: number;
  joinCode: string;
  slideCount: number;
  respondentCount: number;
  createdAt: string;
}

// Renders **bold** spans inside one line of AI-insight text.
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// The insights API returns lightweight markdown (paragraphs + "* " bullets).
// Parse just enough of it to render real <p>/<ul> instead of showing the
// literal "**"/"*" characters via whitespace-pre-line.
function renderInsight(text: string, slides: FlaggedSlide[]) {
  const rateBySlideNumber = new Map(slides.map((s) => [s.slideNumber, s.confusionRate]));
  const blocks: { type: "p" | "ul"; items: string[] }[] = [];

  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    const bullet = line.match(/^[*-]\s+(.*)/);
    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") last.items.push(bullet[1]);
      else blocks.push({ type: "ul", items: [bullet[1]] });
    } else {
      blocks.push({ type: "p", items: [line.trim()] });
    }
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, i) =>
        block.type === "ul" ? (
          <ul key={i} className="space-y-2">
            {block.items.map((item, j) => {
              const slideMatch = item.match(/Slide\s+(\d+)/i);
              const rate = slideMatch ? rateBySlideNumber.get(Number(slideMatch[1])) : undefined;
              const dotColor = rate === undefined ? undefined : heatColor(rate);
              return (
                <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-ink">
                  <span
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    style={dotColor ? { backgroundColor: dotColor } : undefined}
                  />
                  <span>{renderInline(item)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p key={i} className="text-sm leading-relaxed text-ink">
            {renderInline(block.items[0])}
          </p>
        )
      )}
    </div>
  );
}

// Same cool -> amber -> red scale used on the heatmap page, for the confusion
// badges on flagged-slide thumbnails.
function heatColor(rate: number): string {
  const cool = [62, 124, 177];
  const amber = [232, 163, 61];
  const red = [214, 67, 47];

  const [from, to, t] = rate <= 0.5 ? [cool, amber, rate / 0.5] : [amber, red, (rate - 0.5) / 0.5];
  const mix = from.map((c, i) => Math.round(c + (to[i] - c) * t));
  return `rgb(${mix.join(",")})`;
}

export default function InsightsPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<LectureSummary[] | null>(null);
  const [listError, setListError] = useState("");

  const [selectedLecture, setSelectedLecture] = useState<LectureSummary | null>(null);
  const [insights, setInsights] = useState<LectureInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/teacher/lectures")
      .then(async (res) => {
        if (res.status === 401) {
          router.push("/login");
          return null;
        }
        if (!res.ok) throw new Error("Request failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) setLectures(data.lectures);
      })
      .catch(() => {
        if (!cancelled) setListError("Couldn't load your lectures. Please refresh to try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  function loadInsights(lecture: LectureSummary, force = false) {
    setSelectedLecture(lecture);
    setInsights(null);
    setInsightsError("");
    setInsightsLoading(true);

    getLectureInsights(lecture.id, { force })
      .then((data) => setInsights(data))
      .catch(() => setInsightsError("Failed to generate insights. Please try again later."))
      .finally(() => setInsightsLoading(false));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-10">
        {!selectedLecture && (
          <>
            <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Lecture insights</h1>
            <p className="mb-6 text-sm text-ink-muted">
              Pick a lecture to see AI-generated insights based on its most confusing slides.
            </p>

            {listError && <p className="text-sm text-heat-red">{listError}</p>}

            {!listError && lectures === null && (
              <p className="text-sm text-ink-muted">Loading your lectures…</p>
            )}

            {lectures !== null && lectures.length === 0 && (
              <EmptyState
                icon={<Presentation size={22} />}
                title="No lectures yet"
                description="Upload a lecture from the dashboard to start collecting responses."
              />
            )}

            {lectures !== null && lectures.length > 0 && (
              <ul className="flex flex-col gap-3">
                {lectures.map((lecture) => (
                  <li key={lecture.id}>
                    <button
                      type="button"
                      onClick={() => loadInsights(lecture)}
                      className="flex w-full flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4 text-left transition-colors hover:border-line-strong"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{lecture.name}</p>
                        <p className="mt-0.5 truncate text-sm text-ink-muted">
                          {lecture.topic} · Semester {lecture.semester} · {lecture.year} ·{" "}
                          {lecture.slideCount} slide{lecture.slideCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-ink-faint">
                        {lecture.respondentCount} student{lecture.respondentCount === 1 ? "" : "s"} responded
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {selectedLecture && (
          <>
            <button
              type="button"
              onClick={() => {
                setSelectedLecture(null);
                setInsights(null);
                setInsightsError("");
              }}
              className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
            >
              <ArrowLeft size={15} />
              All lectures
            </button>

            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h1 className="font-serif text-2xl text-ink sm:text-3xl">{selectedLecture.name}</h1>
              {insights?.insight && (
                <button
                  type="button"
                  onClick={() => loadInsights(selectedLecture, true)}
                  disabled={insightsLoading}
                  className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:text-ink disabled:opacity-50"
                >
                  <RefreshCw size={13} />
                  Regenerate
                </button>
              )}
            </div>
            <p className="mb-8 text-sm text-ink-muted">
              {selectedLecture.respondentCount} student{selectedLecture.respondentCount === 1 ? "" : "s"}{" "}
              responded across {selectedLecture.slideCount} slide
              {selectedLecture.slideCount === 1 ? "" : "s"}.
            </p>

            {insightsLoading && (
              <p className="text-sm text-ink-muted">Analyzing confusing slides…</p>
            )}

            {insightsError && <p className="text-sm text-heat-red">{insightsError}</p>}

            {!insightsLoading && !insightsError && insights && !insights.insight && (
              <EmptyState
                icon={<Sparkles size={22} />}
                title="No highly-confusing slides yet"
                description="Once enough students mark slides confusing, insights will appear here."
              />
            )}

            {!insightsLoading && !insightsError && insights?.insight && (
              <>
                <div className="mb-8 rounded-xl border border-line bg-surface px-6 py-5">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <Sparkles size={13} />
                    </span>
                    <span className="text-xs font-medium uppercase tracking-wide text-accent">
                      AI insight
                    </span>
                  </div>
                  {renderInsight(insights.insight, insights.slides)}
                </div>

                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Based on these slides
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {insights.slides.map((slide) => (
                    <div key={slide.slideId} className="overflow-hidden rounded-xl border border-line bg-surface">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slide.imageUrl} alt={`Slide ${slide.slideNumber}`} className="w-full" />
                      <div className="flex items-center justify-between px-3 py-2">
                        <p className="text-xs font-medium text-ink">Slide {slide.slideNumber}</p>
                        <span
                          className="rounded-full px-2 py-0.5 font-mono text-[11px] text-white"
                          style={{ backgroundColor: heatColor(slide.confusionRate) }}
                        >
                          {Math.round(slide.confusionRate * 100)}%
                        </span>
                      </div>
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
