import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Guarded by middleware (matcher: /api/teacher/:path*), which verifies the JWT
// cookie and forwards the authenticated teacher as x-teacher-id.
export async function GET(req: NextRequest) {
  try {
    const teacherId = req.headers.get("x-teacher-id");

    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lectures = await prisma.lecture.findMany({
      where: { teacherId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        topic: true,
        semester: true,
        year: true,
        joinCode: true,
        createdAt: true,
        _count: { select: { slides: true } },
      },
    });

    return NextResponse.json({
      lectures: lectures.map(({ _count, ...lecture }) => ({
        ...lecture,
        slideCount: _count.slides,
      })),
    });
  } catch (error) {
    console.error("Failed to list lectures:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
