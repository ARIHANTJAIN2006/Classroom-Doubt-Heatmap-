"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Presentation } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";

interface LectureSummary {
  id: string;
  name: string;
  topic: string;
  semester: number;
  year: number;
  joinCode: string;
  slideCount: number;
  createdAt: string;
}

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [lectures, setLectures] = useState<LectureSummary[] | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/teacher/lectures")
      .then(async (res) => {
        // The cookie is valid for an hour, so an expired session is the most
        // likely failure here — send them back to log in rather than showing
        // an error they can do nothing about.
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
        if (!cancelled) setLoadError("Couldn't load your lectures. Please refresh to try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-ink sm:text-3xl">Your lectures</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Every lecture you've uploaded, newest first.
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

        {loadError && <p className="text-sm text-heat-red">{loadError}</p>}

        {!loadError && lectures === null && (
          <p className="text-sm text-ink-muted">Loading your lectures…</p>
        )}

        {lectures !== null && lectures.length === 0 && (
          <EmptyState
            icon={<Presentation size={22} />}
            title="No lectures yet"
            description="Upload a PDF to create your first lecture. You'll get a join code to share with your class."
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

        {lectures !== null && lectures.length > 0 && (
          <ul className="flex flex-col gap-3">
            {lectures.map((lecture) => (
              <li key={lecture.id}>
                <Link
                  href={`/teacher/lecture/${lecture.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-4 transition-colors hover:border-line-strong"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{lecture.name}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                      {lecture.topic} · Semester {lecture.semester} · {lecture.year} ·{" "}
                      {lecture.slideCount} slide{lecture.slideCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-ink-faint">
                    Join code <span className="text-accent">{lecture.joinCode}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
