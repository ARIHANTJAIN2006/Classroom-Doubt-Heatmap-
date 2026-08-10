"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface JoinCodeCardProps {
  code: string;
  joinUrl: string;
}

export default function JoinCodeCard({ code, joinUrl }: JoinCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-line bg-surface px-8 py-10 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-ink-faint">
          Join code
        </p>
        <p className="mt-2 font-mono text-4xl font-semibold tracking-widest text-ink sm:text-5xl">
          {code}
        </p>
      </div>

      <div className="rounded-xl border border-line bg-white p-3">
        <QRCodeSVG value={joinUrl} size={140} fgColor="#22262B" bgColor="#FFFFFF" />
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="tap-target flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
      >
        {copied ? <Check size={16} className="text-accent" /> : <Copy size={16} />}
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  );
}
