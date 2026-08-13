"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import axios from "axios";

const MIN_PASSWORD_LENGTH = 6;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) return;
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password should be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setSubmitting(true);
    axios.post("/api/signup", {
      name: name.trim(),
      email: email.trim(),
      password,
    },
  {withCredentials: true})
      .then((response) => {
        console.log(response.data);
        router.push("/login");
      })
      .catch((err) => {
        const message =
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Something went wrong signing up.";
        setError(message);
        setSubmitting(false);
      });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            Classroom Doubt Heatmap
          </p>
          <h1 className="mt-3 font-serif text-3xl text-ink">Create your account</h1>
          <p className="mt-2 text-sm text-ink-muted">Set up teaching in a few seconds.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-line bg-surface px-6 py-8 animate-fade-up"
        >
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
              Your name
            </label>
            <input
              id="name"
              autoFocus
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Mr. Rao"
              className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm password"
              className="tap-target w-full rounded-lg border border-line bg-white px-4 text-ink placeholder:text-ink-faint focus:border-accent"
            />
          </div>

          {error && <p className="text-sm text-heat-red">{error}</p>}

          <button
            type="submit"
            disabled={!name.trim() || !email.trim() || !password || submitting}
            className="tap-target flex items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            <UserPlus size={16} />
            {submitting ? "Creating account…" : "Create account"}
          </button>

          <p className="text-center text-xs text-ink-faint">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              Log in
            </Link>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Authentication will be connected when the backend is ready.
        </p>
      </div>
    </main>
  );
}