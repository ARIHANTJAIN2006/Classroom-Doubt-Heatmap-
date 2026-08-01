"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import ReactionButton from "@/components/ReactionButton";
import ProgressDots from "@/components/ProgressDots";
import {
  getLectureByCode,
  getOrCreateStudentSession,
  getSessionMarks,
  removeMark,
  submitMark,
} from "@/lib/mockApi";
import type { Lecture, ReactionType, Slide } from "@/lib/types";
import { REACTION_LABELS, REACTION_TYPES } from "@/lib/types";

const SWIPE_THRESHOLD = 50;

export default function StudentViewPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [marksBySlide, setMarksBySlide] = useState<Record<string, Set<ReactionType>>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notFound, setNotFound] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { lecture, slides } = await getLectureByCode(params.code);
        setLecture(lecture);
        setSlides(slides);

        if (lecture.status === "open") {
          const session = await getOrCreateStudentSession(lecture.id);
          setSessionId(session);
          const existing = await getSessionMarks(lecture.id, session);
          const map: Record<string, Set<ReactionType>> = {};
          for (const m of existing) {
            if (!map[m.slideId]) map[m.slideId] = new Set();
            map[m.slideId].add(m.reaction);
          }
          setMarksBySlide(map);
        }
      } catch {
        setNotFound(true);
      }
    })();
  }, [params.code]);

  const reactedIndexes = useMemo(() => {
    const set = new Set<number>();
    slides.forEach((s, i) => {
      if (marksBySlide[s.id]?.size) set.add(i);
    });
    return set;
  }, [slides, marksBySlide]);

  const currentSlide = slides[currentIndex];

  const goTo = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(slides.length - 1, index)));
  };

  const handleToggleReaction = async (reaction: ReactionType) => {
    if (!lecture || !currentSlide || !sessionId) return;
    const active = marksBySlide[currentSlide.id]?.has(reaction) ?? false;

    setMarksBySlide((prev) => {
      const next = { ...prev };
      const set = new Set(next[currentSlide.id] ?? []);
      if (active) set.delete(reaction);
      else set.add(reaction);
      next[currentSlide.id] = set;
      return next;
    });

    if (active) {
      await removeMark(lecture.id, currentSlide.id, sessionId, reaction);
    } else {
      await submitMark(lecture.id, currentSlide.id, sessionId, reaction);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > SWIPE_THRESHOLD) goTo(currentIndex - 1);
    else if (deltaX < -SWIPE_THRESHOLD) goTo(currentIndex + 1);
    touchStartX.current = null;
  };

  if (notFound) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-xl text-ink">Lecture not found</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Double check the code with your teacher.
        </p>
      </main>
    );
  }

  if (!lecture || !currentSlide) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Loading slides…
      </div>
    );
  }

  if (lecture.status === "closed") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <Lock className="mb-3 text-ink-faint" size={28} />
        <h1 className="font-serif text-xl text-ink">Review window is closed</h1>
        <p className="mt-2 max-w-xs text-sm text-ink-muted">
          Your teacher has closed responses for "{lecture.title}".
        </p>
      </main>
    );
  }

  const isLast = currentIndex === slides.length - 1;

  return (
    <div
      className="flex min-h-screen flex-col bg-ink"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="px-4 pt-4">
        <ProgressDots
          total={slides.length}
          currentIndex={currentIndex}
          reactedIndexes={reactedIndexes}
          onSelect={goTo}
        />
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 py-3">
        <button
          type="button"
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
          aria-label="Previous slide"
          className="tap-target absolute left-1 z-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
        >
          <ChevronLeft size={22} />
        </button>

        <img
          src={currentSlide.imageUrl}
          alt={`Slide ${currentIndex + 1}`}
          className="max-h-[65vh] w-full rounded-lg object-contain"
          draggable={false}
        />

        <button
          type="button"
          onClick={() => goTo(currentIndex + 1)}
          disabled={isLast}
          aria-label="Next slide"
          className="tap-target absolute right-1 z-10 flex items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="rounded-t-3xl bg-bg px-4 pb-6 pt-5">
        <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-ink-faint">
          Did this slide confuse you?
        </p>
        <div className="mb-4 grid grid-cols-3 gap-3">
          {REACTION_TYPES.map((reaction) => (
            <ReactionButton
              key={reaction}
              reaction={reaction}
              label={REACTION_LABELS[reaction]}
              active={marksBySlide[currentSlide.id]?.has(reaction) ?? false}
              onClick={() => handleToggleReaction(reaction)}
              size="lg"
            />
          ))}
        </div>

        {isLast ? (
          <button
            type="button"
            onClick={() => router.push(`/lecture/${lecture.joinCode}/done`)}
            className="tap-target w-full rounded-full bg-accent text-sm font-medium text-white"
          >
            Finish
          </button>
        ) : (
          <button
            type="button"
            onClick={() => goTo(currentIndex + 1)}
            className="tap-target w-full rounded-full border border-line text-sm font-medium text-ink hover:bg-surfacemuted"
          >
            Next slide
          </button>
        )}
      </div>
    </div>
  );
}
