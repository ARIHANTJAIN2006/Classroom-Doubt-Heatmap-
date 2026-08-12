"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import TeacherHeader from "@/components/TeacherHeader";
import UploadDropzone from "@/components/UploadDropzone";

export default function UploadLecturePage() {
  const [pages, setPages] = useState<string[] | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const canSubmit = Boolean(pages?.length && title.trim() && subject.trim());

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setMessage("Your slides are ready to send once the backend upload endpoint is connected.");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Upload today&apos;s slides</h1>
        <p className="mb-8 text-sm text-ink-muted">
          Slides can be previewed here. Saving them will be enabled when the backend is ready.
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
            disabled={!canSubmit}
            className="tap-target self-start rounded-full bg-accent px-6 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            Prepare lecture
          </button>
        </form>
      </main>
    </div>
  );
}
