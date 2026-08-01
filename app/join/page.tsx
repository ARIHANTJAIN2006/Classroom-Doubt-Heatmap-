"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QrCode } from "lucide-react";
import { getLectureByCode } from "@/lib/mockApi";

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("code");
    if (prefill) setCode(prefill.toUpperCase());
  }, [searchParams]);

  const handleChange = (value: string) => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setCode(cleaned);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setChecking(true);
    try {
      const { lecture } = await getLectureByCode(code.trim());
      router.push(`/lecture/${lecture.joinCode}/view`);
    } catch {
      setError("We couldn't find a lecture with that code. Check with your teacher and try again.");
      setChecking(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Join a lecture
        </p>
        <h1 className="mb-8 font-serif text-2xl text-ink">Enter today's code</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="PHY-482"
            autoFocus
            autoCapitalize="characters"
            inputMode="text"
            className="tap-target w-full rounded-xl border border-line bg-white px-4 text-center font-mono text-2xl tracking-widest text-ink placeholder:text-ink-faint focus:border-accent"
          />
          {error && <p className="text-sm text-heat-red">{error}</p>}
          <button
            type="submit"
            disabled={!code.trim() || checking}
            className="tap-target rounded-full bg-accent px-6 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {checking ? "Checking…" : "Join lecture"}
          </button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-faint">
          <QrCode size={14} />
          <span>or scan the QR your teacher shared</span>
        </div>
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  );
}
