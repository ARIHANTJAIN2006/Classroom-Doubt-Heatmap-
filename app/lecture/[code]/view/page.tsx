"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { getLectureByCode, submitRating, type LectureWithSlides } from "@/lib/api";
import { getParticipantId } from "@/lib/participant";
import { cn } from "@/lib/utils";
import type { ReactionType } from "@/lib/types";

export default function StudentViewPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();

  const [lecture, setLecture] = useState<LectureWithSlides | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, ReactionType>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getLectureByCode(code)
      .then(setLecture)
      .catch(() => setLoadError(true));
  }, [code]);

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Lock className="mb-3 text-ink-faint" size={28} />
        <h1 className="font-serif text-xl text-ink">Lecture not found</h1>
        <p className="mt-2 max-w-sm text-sm text-ink-muted">
          Double check the join code with your teacher and try again.
        </p>
        <button
          onClick={() => router.push("/join")}
          className="tap-target mt-6 rounded-full bg-accent px-5 text-sm font-medium text-white"
        >
          Back to join page
        </button>
      </main>
    );
  }

  if (!lecture) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center text-sm text-ink-muted">
        Loading slides…
      </main>
    );
  }

  const slide = lecture.slides[slideIndex];
  const isLast = slideIndex === lecture.slides.length - 1;
  const selected = choices[slide.id];

  async function handleMark(reaction: ReactionType) {
    setSubmitting(true);
    setChoices((prev) => ({ ...prev, [slide.id]: reaction }));
    try {
      await submitRating(code, slide.id, getParticipantId(), reaction);
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (isLast) {
      router.push(`/lecture/${code}/done`);
      return;
    }
    setSlideIndex((i) => i + 1);
  }

  return (
    <main className="flex min-h-screen flex-col items-center px-6 py-10">
      <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
        Slide {slideIndex + 1} of {lecture.slides.length}
      </p>

      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.imageUrl} alt={`Slide ${slide.slideNumber}`} className="w-full" />
      </div>

      <div className="mt-6 flex w-full max-w-2xl gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleMark("confusing")}
          className={cn(
            "tap-target flex-1 rounded-full border-2 text-sm font-medium transition-colors disabled:opacity-60",
            selected === "confusing"
              ? "border-heat-red bg-heat-red text-white"
              : "border-line-strong bg-surface text-ink hover:border-heat-red"
          )}
        >
          Confusing
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleMark("clear")}
          className={cn(
            "tap-target flex-1 rounded-full border-2 text-sm font-medium transition-colors disabled:opacity-60",
            selected === "clear"
              ? "border-heat-cool bg-heat-cool text-white"
              : "border-line-strong bg-surface text-ink hover:border-heat-cool"
          )}
        >
          Clear
        </button>
      </div>

      <div className="mt-8 flex w-full max-w-2xl items-center justify-between">
        <button
          type="button"
          disabled={slideIndex === 0}
          onClick={() => setSlideIndex((i) => i - 1)}
          className="tap-target rounded-full px-4 text-sm font-medium text-ink-muted transition-opacity disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="tap-target rounded-full bg-accent px-6 text-sm font-medium text-white hover:bg-accent-dark"
        >
          {isLast ? "Finish" : "Next"}
        </button>
      </div>
    </main>
  );
}
