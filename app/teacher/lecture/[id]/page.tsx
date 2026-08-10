"use client";

import { Presentation } from "lucide-react";
import TeacherHeader from "@/components/TeacherHeader";
import EmptyState from "@/components/EmptyState";

export default function TeacherLecturePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <TeacherHeader teacherName="Teacher" />

      <main className="mx-auto flex w-full max-w-4xl flex-1 items-center px-6 py-10 sm:px-10">
        <EmptyState
          icon={<Presentation size={22} />}
          title="Lecture data is not connected"
          description="This heatmap page will show slide responses after the backend is added."
        />
      </main>
    </div>
  );
}
