export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  // Mock-only: stored in localStorage, never hashed or verified server-side.
  // There is no real backend here — see lib/mockApi.ts.
  password: string;
  createdAt: string;
}

export interface Lecture {
  id: string;
  teacherName: string;
  title: string;
  subject: string;
  unit: string;
  topic: string;
  date: string; // ISO date
  joinCode: string; // short human-friendly code, e.g. "PHY-482"
  slideCount: number;
  status: "open" | "closed"; // review window open/closed
  createdAt: string;
}

export interface Slide {
  id: string;
  lectureId: string;
  index: number;
  imageUrl: string; // data URL from client-side PDF render, or seeded placeholder
}

export type ReactionType = "confused" | "too_fast" | "important";

export interface ConfusionMark {
  id: string;
  lectureId: string;
  slideId: string;
  studentSessionId: string; // anonymous, stored in localStorage per lecture
  reaction: ReactionType;
  // Reserved for future region-level marking — not implemented in the UI yet.
  x?: number;
  y?: number;
  createdAt: string;
}

export interface SlideAggregate {
  slideId: string;
  index: number;
  imageUrl: string;
  totalMarks: number;
  breakdown: Record<ReactionType, number>;
  intensity: number; // normalized 0–1, drives heatmap color
}

// Derived / read-model types used by the trends view. These are computed from
// Lecture + ConfusionMark data inside lib/mockApi.ts — nothing new is persisted.
export interface TrendPoint {
  lectureId: string;
  title: string;
  subject: string;
  unit: string;
  topic: string;
  date: string;
  confusionRate: number; // 0–1, weighted confusion signal for the lecture
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

export const REACTION_TYPES: ReactionType[] = ["confused", "too_fast", "important"];

export const REACTION_LABELS: Record<ReactionType, string> = {
  confused: "Confused",
  too_fast: "Too fast",
  important: "Important",
};
