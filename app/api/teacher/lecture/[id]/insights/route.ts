import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const teacherId = req.headers.get("x-teacher-id");
  if (!teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured");
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const { id: lectureId } = await params;

  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: {
      id: true,
      name: true,
      teacherId: true,
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
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }
  if (lecture.teacherId !== teacherId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const force = req.nextUrl.searchParams.get("force") === "true";

  // Check for cached insight
  if (!force) {
    const cached = await prisma.lectureInsight.findUnique({
      where: { lectureId },
    });

    if (cached) {
      // Build the flagged slides from cached slideIds
      const slidesWithStats = buildSlideStats(lecture.slides);
      const flaggedSlides = slidesWithStats
        .filter((s) => cached.slideIds.includes(s.slideId))
        .map(({ slideId, slideNumber, imageUrl, confusionRate, totalMarks }) => ({
          slideId,
          slideNumber,
          imageUrl,
          confusionRate,
          totalMarks,
        }));

      return NextResponse.json({
        lectureId: lecture.id,
        lectureName: lecture.name,
        insight: cached.insight,
        slides: flaggedSlides,
        generatedAt: cached.generatedAt.toISOString(),
      });
    }
  }

  // Compute slide stats and flag high-confusion slides
  const slidesWithStats = buildSlideStats(lecture.slides);
  const flaggedSlides = slidesWithStats.filter(
    (s) => s.totalMarks > 0 && s.confusionRate >= 0.3
  );

  if (flaggedSlides.length === 0) {
    return NextResponse.json({
      lectureId: lecture.id,
      lectureName: lecture.name,
      insight: null,
      slides: [],
      generatedAt: null,
    });
  }

  // Generate AI insights
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const slideDescriptions = flaggedSlides
      .map(
        (s) =>
          `- Slide ${s.slideNumber}: ${s.confusionRate * 100}% confusion rate (${s.breakdown.confusing} confused, ${s.breakdown.clear} clear, ${s.totalMarks} total responses)`
      )
      .join("\n");

    const prompt = `You are an expert teaching assistant analyzing student feedback for the lecture "${lecture.name}".

The following slides were flagged as having high confusion rates among students:

${slideDescriptions}

Based on this data, provide actionable teaching insights and recommendations:
1. Identify patterns in which slides are confusing students
2. Suggest specific improvements the teacher could make
3. Recommend teaching strategies to address the confusion
4. Keep your response concise and practical (under 300 words)

Format your response as clear, helpful advice directly addressed to the teacher.`;

    const result = await model.generateContent(prompt);
    const insight = result.response.text();

    // Cache the insight
    await prisma.lectureInsight.upsert({
      where: { lectureId },
      create: {
        lectureId,
        slideIds: flaggedSlides.map((s) => s.slideId),
        insight,
      },
      update: {
        slideIds: flaggedSlides.map((s) => s.slideId),
        insight,
        generatedAt: new Date(),
      },
    });

    return NextResponse.json({
      lectureId: lecture.id,
      lectureName: lecture.name,
      insight,
      slides: flaggedSlides.map(({ slideId, slideNumber, imageUrl, confusionRate, totalMarks }) => ({
        slideId,
        slideNumber,
        imageUrl,
        confusionRate,
        totalMarks,
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}

function buildSlideStats(
  slides: {
    id: string;
    slideNumber: number;
    imageUrl: string;
    confusionRatings: { rating: string }[];
  }[]
) {
  return slides.map((slide) => {
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
}
