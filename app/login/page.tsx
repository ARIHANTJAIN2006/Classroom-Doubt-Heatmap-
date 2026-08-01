"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { logInTeacher } from "@/lib/mockApi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setSubmitting(true);
    setError("");
    try {
      await logInTeacher(email, password);
      router.push("/teacher");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong logging in.");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Classroom Doubt Heatmap
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">Welcome back</h1>
          <p className="mt-2 text-sm text-ink-muted">Log in to see your lectures.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-line bg-surface px-6 py-8 animate-fade-up"
        >
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-heat-red">{error}</p>}

          <button
            type="submit"
            disabled={!email.trim() || !password || submitting}
            className="tap-target flex items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            <LogIn size={16} />
            {submitting ? "Logging in…" : "Log in"}
          </button>

          <p className="text-center text-xs text-ink-faint">
            New here?{" "}
            <Link href="/signup" className="font-medium text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-ink-faint">
          This is a demo account system — stored only in your browser, not verified by
          any server.
        </p>

        <p className="mt-3 text-center text-xs text-ink-faint">
          Joining as a student?{" "}
          <Link href="/join" className="font-medium text-accent hover:underline">
            Go to the join page
          </Link>
        </p>
      </div>
    </main>
  );
}
