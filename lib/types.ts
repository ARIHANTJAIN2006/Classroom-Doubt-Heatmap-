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
  gridRows: number;
  gridCols: number;
  createdAt: string;
}

export interface Slide {
  id: string;
  lectureId: string;
  index: number;
  imageUrl: string;
}

// A single marked grid cell on a slide, as toggled by a student.
export interface GridCell {
  row: number;
  col: number;
}

// A grid cell aggregated across every student who marked it on a slide.
export interface HeatmapCell extends GridCell {
  count: number;
  /** Normalized 0..1 — count / totalParticipants. Feed into getHeatColor(). */
  intensity: number;
}

export interface SlideAggregate {
  slideId: string;
  index: number;
  imageUrl: string;
  gridRows: number;
  gridCols: number;
  totalParticipants: number;
  cells: HeatmapCell[];
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
