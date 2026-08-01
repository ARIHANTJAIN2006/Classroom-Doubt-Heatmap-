"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import UploadDropzone from "@/components/UploadDropzone";
import JoinCodeCard from "@/components/JoinCodeCard";
import { createLecture, getTeacherName } from "@/lib/mockApi";
import type { Lecture } from "@/lib/types";

export default function UploadLecturePage() {
  const router = useRouter();
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [pages, setPages] = useState<string[] | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [topic, setTopic] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdLecture, setCreatedLecture] = useState<Lecture | null>(null);

  useEffect(() => {
    getTeacherName().then((name) => {
      if (!name) {
        router.replace("/login");
        return;
      }
      setTeacherName(name);
    });
  }, [router]);

  const canSubmit = Boolean(pages && pages.length > 0 && title.trim() && subject.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teacherName || !pages || !canSubmit) return;
    setCreating(true);
    const lecture = await createLecture(pages, {
      title: title.trim(),
      subject: subject.trim(),
      unit: unit.trim() || "General",
      topic: topic.trim() || title.trim(),
      teacherName,
    });
    setCreatedLecture(lecture);
    setCreating(false);
  };

  if (!teacherName) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  if (createdLecture) {
    const joinUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/join?code=${encodeURIComponent(createdLecture.joinCode)}`
        : createdLecture.joinCode;

    return (
      <div className="flex min-h-screen flex-col">
        <TeacherHeader teacherName={teacherName} />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="mb-2 font-mono text-xs uppercase tracking-widest text-accent">
            Lecture created
          </p>
          <h1 className="mb-6 font-serif text-2xl text-ink">
            Share this code with your class
          </h1>
          <JoinCodeCard code={createdLecture.joinCode} joinUrl={joinUrl} />
          <button
            type="button"
            onClick={() => router.push(`/teacher/lecture/${createdLecture.id}`)}
            className="tap-target mt-8 flex items-center gap-2 rounded-full bg-accent px-6 text-sm font-medium text-white hover:bg-accent-dark"
          >
            Go to lecture heatmap
            <ArrowRight size={16} />
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName={teacherName} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Upload today's slides</h1>
        <p className="mb-8 text-sm text-ink-muted">
          Rendered locally in your browser — nothing is uploaded anywhere.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Slides (PDF)</label>
            <UploadDropzone onComplete={setPages} onReset={() => setPages(null)} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-ink">
                Lecture title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Entropy & the Second Law"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-ink">
                Subject
              </label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Physics"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="unit" className="mb-1.5 block text-sm font-medium text-ink">
                Unit
              </label>
              <input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. Thermodynamics"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-ink">
                Topic <span className="font-normal text-ink-faint">(used to track trends)</span>
              </label>
              <input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Entropy & Second Law"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || creating}
            className="tap-target self-start rounded-full bg-accent px-6 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create lecture"}
          </button>
        </form>
      </main>
    </div>
  );
}
