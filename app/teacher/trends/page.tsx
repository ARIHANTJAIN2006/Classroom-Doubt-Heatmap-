"use client";

import { LineChart as LineChartIcon } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";

export default function TrendsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 sm:px-10">
        <h1 className="mb-1 font-serif text-2xl text-ink sm:text-3xl">Semester trends</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Confusion-rate trends will appear here once lecture data is connected.
        </p>

        <EmptyState
          icon={<LineChartIcon size={22} />}
          title="No trends to show yet"
          description="Connect the backend to collect student responses and build trend charts."
        />
      </main>
    </div>
  );
}
