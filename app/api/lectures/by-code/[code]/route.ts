import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const lecture = await prisma.lecture.findUnique({
      where: { joinCode: code },
      select: {
        id: true,
        name: true,
        joinCode: true,
        slides: {
          select: {
            id: true,
            slideNumber: true,
            imageUrl: true,
          },
          orderBy: { slideNumber: "asc" },
        },
      },
    });

    if (!lecture) {
      return NextResponse.json(
        { error: "Lecture not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(lecture);
  } catch (error) {
    console.error("Error fetching lecture by code:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
