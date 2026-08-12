"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import TeacherHeader from "@/components/TeacherHeader";
import UploadDropzone from "@/components/UploadDropzone";
import { ApiError, createLecture } from "@/lib/api";

export default function UploadLecturePage() {
  const router = useRouter();
  const [pages, setPages] = useState<string[] | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = Boolean(pages?.length && title.trim() && subject.trim());

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !pages) return;
    setSubmitting(true);
    setMessage("");
    try {
      const lecture = await createLecture({
        title: title.trim(),
        subject: subject.trim(),
        unit: unit.trim(),
        topic: topic.trim(),
        images: pages,
      });
      router.push(`/teacher/lecture/${lecture.id}`);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : "Couldn't upload the lecture. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Upload today&apos;s slides</h1>
        <p className="mb-8 text-sm text-ink-muted">
          Students will get a join code once you prepare the lecture.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Slides (PDF)</label>
            <UploadDropzone
              onComplete={(uploadedPages) => {
                setPages(uploadedPages);
                setMessage("");
              }}
              onReset={() => {
                setPages(null);
                setMessage("");
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-ink">
                Lecture title
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
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
                onChange={(event) => setSubject(event.target.value)}
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
                onChange={(event) => setUnit(event.target.value)}
                placeholder="e.g. Thermodynamics"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-ink">
                Topic
              </label>
              <input
                id="topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="e.g. Entropy & Second Law"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
          </div>

          {message && <p className="text-sm text-ink-muted">{message}</p>}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="tap-target self-start rounded-full bg-accent px-6 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {submitting ? "Uploading..." : "Prepare lecture"}
          </button>
        </form>
      </main>
    </div>
  );
}
