"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Presentation } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";
import { ApiError, listLectures } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { Lecture } from "@/lib/types";

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<Lecture[] | null>(null);

  useEffect(() => {
    listLectures()
      .then(setLectures)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.push("/login");
          return;
        }
        setLectures([]);
      });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-ink sm:text-3xl">Your lectures</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {lectures?.length ? `${lectures.length} lecture${lectures.length === 1 ? "" : "s"}` : "Upload slides to get a join code."}
            </p>
          </div>
          <Link
            href="/teacher/upload"
            className="tap-target flex items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-dark"
          >
            <Plus size={16} />
            Upload new lecture
          </Link>
        </div>

        {lectures && lectures.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {lectures.map((lecture) => (
              <Link
                key={lecture.id}
                href={`/teacher/lecture/${lecture.id}`}
                className="rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wide text-accent">
                    {lecture.joinCode}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      lecture.status === "open" ? "bg-accent-soft text-accent" : "bg-surfacemuted text-ink-faint"
                    }`}
                  >
                    {lecture.status}
                  </span>
                </div>
                <h2 className="font-serif text-lg text-ink">{lecture.title}</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {lecture.subject}
                  {lecture.topic ? ` · ${lecture.topic}` : ""}
                </p>
                <p className="mt-3 text-xs text-ink-faint">
                  {lecture.slideCount} slide{lecture.slideCount === 1 ? "" : "s"} · {formatDate(lecture.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Presentation size={22} />}
            title="No lectures yet"
            description="Upload your first PDF to create a join code and start collecting doubts."
            action={
              <Link
                href="/teacher/upload"
                className="tap-target inline-flex items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-white hover:bg-accent-dark"
              >
                <Plus size={16} />
                Prepare an upload
              </Link>
            }
          />
        )}
      </main>
    </div>
  );
}
