import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lectureId } = await params;

    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: {
        id: true,
        name: true,
        slides: {
          select: {
            id: true,
            slideNumber: true,
            imageUrl: true,
            confusionRatings: {
              select: { rating: true },
            },
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

    const slides = lecture.slides.map((slide) => {
      const confusing = slide.confusionRatings.filter(
        (r) => r.rating === "confusing"
      ).length;
      const clear = slide.confusionRatings.filter(
        (r) => r.rating === "clear"
      ).length;
      const totalMarks = confusing + clear;

      return {
        slideId: slide.id,
        slideNumber: slide.slideNumber,
        imageUrl: slide.imageUrl,
        totalMarks,
        breakdown: { confusing, clear },
        confusionRate: totalMarks > 0 ? confusing / totalMarks : 0,
      };
    });

    return NextResponse.json({
      lectureId: lecture.id,
      lectureName: lecture.name,
      slides,
    });
  } catch (error) {
    console.error("Error fetching heatmap:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
