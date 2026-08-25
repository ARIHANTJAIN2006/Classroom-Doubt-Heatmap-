"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherHeaderProps {
  teacherName: string;
}

export default function TeacherHeader({ teacherName }: TeacherHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logOutError, setLogOutError] = useState("");

  async function handleLogOut() {
    setLoggingOut(true);
    setLogOutError("");

    // The session lives in an httpOnly cookie, so only the server can clear it.
    // fetch resolves on 4xx/5xx, so the status has to be checked explicitly —
    // and if the cookie survived we must not navigate, or the user walks away
    // from a still-authenticated browser believing they signed out.
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
    } catch {
      setLogOutError("Couldn't log out. Please try again.");
      setLoggingOut(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4 sm:px-10">
      <Link href="/teacher" className="flex items-baseline gap-2">
        <span className="font-serif text-lg text-ink">Doubt Heatmap</span>
      </Link>
      <nav className="flex items-center gap-1">
        <Link
          href="/teacher"
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === "/teacher"
              ? "bg-accent-soft text-accent"
              : "text-ink-muted hover:text-ink"
          )}
        >
          Dashboard
        </Link>
        <Link
          href="/teacher/insights"
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === "/teacher/insights"
              ? "bg-accent-soft text-accent"
              : "text-ink-muted hover:text-ink"
          )}
        >
          Insights
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        {logOutError && (
          <span role="alert" className="text-xs text-heat-red">
            {logOutError}
          </span>
        )}
        <span className="font-mono text-xs text-ink-faint">{teacherName}</span>
        <button
          type="button"
          onClick={handleLogOut}
          disabled={loggingOut}
          aria-label="Log out"
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-ink-faint transition-colors hover:bg-surfacemuted hover:text-ink disabled:opacity-50"
        >
          <LogOut size={13} />
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    </header>
  );
}
