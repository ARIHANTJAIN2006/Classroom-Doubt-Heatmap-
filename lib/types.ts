export interface Lecture {
  id: string;
  teacherName: string;
  title: string;
  subject: string;
  unit: string;
  topic: string;
  date: string;
  joinCode: string;
  slideCount: number;
  status: "open" | "closed";
  createdAt: string;
}

export interface Slide {
  id: string;
  lectureId: string;
  index: number;
  imageUrl: string;
}

// Mirrors the `Rating` enum in prisma/schema.prisma.
export type ReactionType = "confusing" | "clear";

export interface SlideAggregate {
  slideId: string;
  index: number;
  imageUrl: string;
  totalMarks: number;
  breakdown: Record<ReactionType, number>;
  intensity: number;
}

export interface TrendPoint {
  lectureId: string;
  title: string;
  subject: string;
  unit: string;
  topic: string;
  date: string;
  confusionRate: number;
  totalMarks: number;
  slideCount: number;
}

export interface TopicConsistency {
  subject: string;
  topic: string;
  lectureCount: number;
  avgConfusionRate: number;
  trend: "rising" | "stable" | "falling";
}

export const REACTION_TYPES: ReactionType[] = ["confusing", "clear"];

export const REACTION_LABELS: Record<ReactionType, string> = {
  confusing: "Confusing",
  clear: "Clear",
};
