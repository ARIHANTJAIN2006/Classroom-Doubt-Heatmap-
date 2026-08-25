import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

// Guarded by middleware (matcher: /api/teacher/:path*), which verifies the JWT
// cookie and forwards the authenticated teacher as x-teacher-id. This route
// exists so the paid /insights call on the FastAPI backend is never reachable
// straight from the browser: it re-checks the caller owns the lecture, then
// forwards the request server-side with the internal shared secret.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const teacherId = req.headers.get("x-teacher-id");
  if (!teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!INTERNAL_API_SECRET) {
    console.error("INTERNAL_API_SECRET is not configured");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const { id: lectureId } = await params;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: { teacherId: true },
  });

  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }
  if (lecture.teacherId !== teacherId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const force = req.nextUrl.searchParams.get("force") === "true";
  const query = force ? "?force=true" : "";

  try {
    const res = await fetch(`${API_URL}/api/lectures/${lectureId}/insights${query}`, {
      headers: { "X-Internal-Secret": INTERNAL_API_SECRET },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Insights service error" }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    console.error("Failed to reach insights service:", error);
    return NextResponse.json({ error: "Insights service unreachable" }, { status: 502 });
  }
}
