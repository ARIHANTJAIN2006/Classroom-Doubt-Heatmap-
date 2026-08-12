"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Presentation } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";
import GridOverlay from "@/components/GridOverlay";
import { ApiError, getHeatmap, getLecture, resolveImageUrl } from "@/lib/api";
import type { LectureDetail } from "@/lib/api";
import type { SlideAggregate } from "@/lib/types";

export default function TeacherLecturePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [heatmap, setHeatmap] = useState<SlideAggregate[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getLecture(params.id), getHeatmap(params.id)])
      .then(([lectureData, heatmapData]) => {
        setLecture(lectureData);
        setHeatmap(heatmapData.slides);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setError(err instanceof ApiError ? err.message : "Couldn't load this lecture.");
      });
  }, [params.id, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-10 sm:px-10">
        {error && (
          <EmptyState icon={<Presentation size={22} />} title="Couldn't load lecture" description={error} />
        )}

        {!error && lecture && (
          <div className="mb-8">
            <div className="mb-1 flex items-center gap-3">
              <h1 className="font-serif text-2xl text-ink sm:text-3xl">{lecture.title}</h1>
              <span className="font-mono text-xs uppercase tracking-wide text-accent">{lecture.joinCode}</span>
            </div>
            <p className="text-sm text-ink-muted">
              {lecture.subject}
              {lecture.topic ? ` · ${lecture.topic}` : ""} ·{" "}
              {heatmap?.[0]?.totalParticipants ?? 0} student{heatmap?.[0]?.totalParticipants === 1 ? "" : "s"} joined
            </p>
          </div>
        )}

        {!error && heatmap && heatmap.length === 0 && (
          <EmptyState
            icon={<Presentation size={22} />}
            title="No slides on this lecture"
            description="Upload slides to start collecting doubts."
          />
        )}

        {!error && heatmap && heatmap.length > 0 && (
          <div className="flex flex-col gap-8">
            {heatmap.map((slide) => (
              <div key={slide.slideId}>
                <p className="mb-2 text-xs font-medium text-ink-faint">Slide {slide.index + 1}</p>
                <div className="relative w-full overflow-hidden rounded-xl border border-line bg-white shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resolveImageUrl(slide.imageUrl)} alt={`Slide ${slide.index + 1}`} className="block w-full" />
                  <GridOverlay
                    rows={slide.gridRows}
                    cols={slide.gridCols}
                    heatmapCells={slide.cells}
                    readOnly
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
