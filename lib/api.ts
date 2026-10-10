export type ReactionType = "confusing" | "clear";

export interface LectureWithSlides {
  id: string;
  name: string;
  joinCode: string;
  slides: { id: string; slideNumber: number; imageUrl: string }[];
}

export interface SlideAggregate {
  slideId: string;
  slideNumber: number;
  imageUrl: string;
  totalMarks: number;
  breakdown: Record<ReactionType, number>;
  confusionRate: number;
}

export interface Heatmap {
  lectureId: string;
  lectureName: string;
  slides: SlideAggregate[];
}

export async function getLectureByCode(joinCode: string): Promise<LectureWithSlides> {
  const res = await fetch(`/api/lectures/by-code/${encodeURIComponent(joinCode)}`);
  if (!res.ok) throw new Error("Lecture not found");
  return res.json();
}

export async function submitRating(
  joinCode: string,
  slideId: string,
  participantId: string,
  rating: ReactionType
): Promise<void> {
  const res = await fetch(
    `/api/lectures/by-code/${encodeURIComponent(joinCode)}/slides/${slideId}/rating`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participant_id: participantId, rating }),
    }
  );
  if (!res.ok) throw new Error("Failed to submit rating");
}

export async function getHeatmap(lectureId: string): Promise<Heatmap> {
  const res = await fetch(`/api/lectures/${lectureId}/heatmap`);
  if (!res.ok) throw new Error("Lecture not found");
  return res.json();
}

export interface FlaggedSlide {
  slideId: string;
  slideNumber: number;
  imageUrl: string;
  confusionRate: number;
  totalMarks: number;
}

export interface LectureInsights {
  lectureId: string;
  lectureName: string;
  insight: string | null;
  slides: FlaggedSlide[];
  generatedAt: string | null;
}

export async function getLectureInsights(
  lectureId: string,
  opts?: { force?: boolean }
): Promise<LectureInsights> {
  const query = opts?.force ? "?force=true" : "";
  const res = await fetch(`/api/teacher/lecture/${lectureId}/insights${query}`);
  if (!res.ok) throw new Error("Couldn't load insights");
  return res.json();
}
