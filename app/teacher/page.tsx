"use client";

import Link from "next/link";
import { Plus, Presentation } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";

export default function TeacherDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 sm:px-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl text-ink sm:text-3xl">Your lectures</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Your lecture history will appear here after the backend is connected.
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

        <EmptyState
          icon={<Presentation size={22} />}
          title="No lectures yet"
          description="Connect your backend to save uploads, create join codes, and display lecture heatmaps here."
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
      </main>
    </div>
  );
}
