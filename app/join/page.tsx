"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";

function cleanCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const codeFromUrl = new URL(window.location.href).searchParams.get("code");
    if (codeFromUrl) setCode(cleanCode(codeFromUrl));
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("Joining lectures will be available once the backend is connected.");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Join a lecture
        </p>
        <h1 className="mb-8 font-serif text-2xl text-ink">Enter today&apos;s code</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            value={code}
            onChange={(event) => {
              setCode(cleanCode(event.target.value));
              setMessage("");
            }}
            placeholder="PHY-482"
            autoFocus
            autoCapitalize="characters"
            inputMode="text"
            className="tap-target w-full rounded-lg border border-line bg-white px-4 text-center font-mono text-2xl tracking-widest text-ink placeholder:text-ink-faint focus:border-accent"
          />

          {message && <p className="text-sm text-ink-muted">{message}</p>}

          <button
            type="submit"
            disabled={!code.trim()}
            className="tap-target rounded-full bg-accent px-4 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            Join lecture
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
