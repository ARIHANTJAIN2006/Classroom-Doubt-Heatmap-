import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string; slideId: string }> }
) {
  try {
    const { code, slideId } = await params;
    const { participant_id, rating } = await req.json();

    if (!participant_id || !rating) {
      return NextResponse.json(
        { error: "participant_id and rating are required" },
        { status: 400 }
      );
    }

    if (rating !== "confusing" && rating !== "clear") {
      return NextResponse.json(
        { error: "rating must be 'confusing' or 'clear'" },
        { status: 400 }
      );
    }

    // Verify the slide belongs to a lecture with this join code
    const slide = await prisma.slide.findUnique({
      where: { id: slideId },
      include: { lecture: { select: { joinCode: true } } },
    });

    if (!slide || slide.lecture.joinCode !== code) {
      return NextResponse.json(
        { error: "Slide not found for this lecture" },
        { status: 404 }
      );
    }

    // Upsert: create or update the rating for this participant + slide
    await prisma.confusionRating.upsert({
      where: {
        slideId_participantId: {
          slideId,
          participantId: participant_id,
        },
      },
      create: {
        slideId,
        participantId: participant_id,
        rating,
      },
      update: {
        rating,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
