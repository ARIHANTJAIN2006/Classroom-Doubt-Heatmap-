"use client";

import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import TeacherHeader from "@/components/TeacherHeader";

export default function UploadLecturePage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [semester, setSemester] = useState("");
  const [year, setYear] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = Boolean(
    pdfFile && name.trim() && topic.trim() && semester.trim() && year.trim() && !submitting
  );

  function pickFile(file: File | undefined) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setMessage("Please select a PDF file.");
      return;
    }
    setPdfFile(file);
    setMessage("");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    pickFile(event.target.files?.[0]);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    pickFile(event.dataTransfer.files?.[0]);
  }

  function resetFile() {
    setPdfFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit || !pdfFile) return;

    setSubmitting(true);
    setMessage("Uploading slides, this can take a moment...");

    try {
      const formData = new FormData();
      formData.append("pdf", pdfFile);
      formData.append("name", name);
      formData.append("topic", topic);
      formData.append("semester", semester);
      formData.append("year", year);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Upload failed");
      }

      const data = await res.json();
      setMessage(`Lecture created. Join code: ${data.joinCode}`);
      resetFile();
      setName("");
      setTopic("");
      setSemester("");
      setYear("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Upload today&apos;s slides</h1>
        <p className="mb-8 text-sm text-ink-muted">
          Select your PDF and fill in the details. Slides upload to Cloudinary when you submit.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">Slides (PDF)</label>

            {!pdfFile ? (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
                  isDragging ? "border-accent bg-accent/5" : "border-line bg-white"
                }`}
              >
                <p className="text-sm text-ink">
                  Drag & drop a PDF here, or <span className="text-accent underline">browse</span>
                </p>
                <p className="mt-1 text-xs text-ink-faint">PDF only</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-line bg-white px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{pdfFile.name}</p>
                  <p className="text-xs text-ink-faint">{(pdfFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={resetFile}
                  className="tap-target shrink-0 text-sm text-ink-muted underline"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
                Lecture name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Entropy & the Second Law"
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
                placeholder="e.g. Thermodynamics"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="semester" className="mb-1.5 block text-sm font-medium text-ink">
                Semester
              </label>
              <input
                id="semester"
                type="number"
                inputMode="numeric"
                value={semester}
                onChange={(event) => setSemester(event.target.value)}
                placeholder="e.g. 1"
                className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
              />
            </div>
            <div>
              <label htmlFor="year" className="mb-1.5 block text-sm font-medium text-ink">
                Year
              </label>
              <input
                id="year"
                type="number"
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="e.g. 2026"
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
            {submitting ? "Uploading..." : "Prepare lecture"}
          </button>
        </form>
      </main>
    </div>
  );
}