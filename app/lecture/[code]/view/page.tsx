"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

export default function StudentViewPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <Lock className="mb-3 text-ink-faint" size={28} />
      <h1 className="font-serif text-xl text-ink">Lecture access is not connected</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        The student slide view and reactions will be available after the backend is added.
      </p>
      <Link
        href="/join"
        className="tap-target mt-6 rounded-full bg-accent px-5 text-sm font-medium text-white"
      >
        Back to join page
      </Link>
    </main>
  );
}
