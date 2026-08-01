"use client";

import { EyeOff } from "lucide-react";

export default function DonePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <EyeOff size={24} />
      </div>
      <h1 className="font-serif text-2xl text-ink">Thanks — you're done</h1>
      <p className="mt-3 max-w-xs text-sm text-ink-muted">
        Your responses were submitted anonymously. No one, including your teacher, can see
        that this was you.
      </p>
    </main>
  );
}
