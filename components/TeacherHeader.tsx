"use client";

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

  function handleLogOut() {
    router.push("/login");
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
          href="/teacher/trends"
          className={cn(
            "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
            pathname === "/teacher/trends"
              ? "bg-accent-soft text-accent"
              : "text-ink-muted hover:text-ink"
          )}
        >
          Trends
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-ink-faint">{teacherName}</span>
        <button
          type="button"
          onClick={handleLogOut}
          aria-label="Log out"
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-ink-faint transition-colors hover:bg-surfacemuted hover:text-ink"
        >
          <LogOut size={13} />
          Log out
        </button>
      </div>
    </header>
  );
}
