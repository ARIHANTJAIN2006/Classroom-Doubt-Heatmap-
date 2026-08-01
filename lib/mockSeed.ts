import type { ConfusionMark, Lecture, ReactionType, Slide } from "./types";
import { generateId, generateJoinCode, shuffle } from "./utils";

export const SEED_TEACHER_NAME = "Demo Teacher";

// ---------------------------------------------------------------------------
// Placeholder slide art. There's no real PDF for seeded lectures, so each
// slide is a small inline SVG "snapshot" — a subject-tinted header band, a
// heading, and a few fake bullet lines — rather than a blank rectangle.
// ---------------------------------------------------------------------------

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function placeholderSlideImage(
  index: number,
  heading: string,
  accentHex: string
): string {
  // Deterministic pseudo-random bullet widths so slides feel varied but stable.
  const seed = (index * 37 + heading.length * 13) % 97;
  const widths = [0.7, 0.55, 0.42].map((base, i) => {
    const jitter = ((seed * (i + 1)) % 20) / 100;
    return Math.round((base + jitter) * 720);
  });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
    <rect width="960" height="540" fill="#FFFFFF"/>
    <rect x="0" y="0" width="960" height="540" fill="none" stroke="#D8DEDA" stroke-width="3"/>
    <rect x="0" y="0" width="960" height="88" fill="${accentHex}" opacity="0.14"/>
    <rect x="40" y="34" width="18" height="18" rx="3" fill="${accentHex}" opacity="0.55"/>
    <text x="72" y="50" font-family="Georgia, 'Times New Roman', serif" font-size="28" fill="#22262B">${escapeXml(
      heading
    )}</text>
    <line x1="72" y1="122" x2="880" y2="122" stroke="#D8DEDA" stroke-width="2"/>
    <rect x="72" y="168" width="${widths[0]}" height="16" rx="4" fill="#E9EDEB"/>
    <rect x="72" y="212" width="${widths[1]}" height="16" rx="4" fill="#E9EDEB"/>
    <rect x="72" y="256" width="${widths[2]}" height="16" rx="4" fill="#E9EDEB"/>
    <rect x="72" y="316" width="640" height="150" rx="10" fill="#F2F4F3" stroke="#D8DEDA" stroke-width="2"/>
    <text x="920" y="514" font-family="'Courier New', monospace" font-size="18" fill="#8A938E" text-anchor="end">Slide ${
      index + 1
    }</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// ---------------------------------------------------------------------------
// Fixed semester of lectures. Two topics — "Entropy & Second Law" and
// "Subnetting" — deliberately recur across more than one lecture so the
// trends page's "consistently confusing" ranking has something real to show,
// rather than a single noisy bad day.
// ---------------------------------------------------------------------------

const HEADING_FRAGMENTS = [
  "Introduction",
  "Key Definitions",
  "Worked Example",
  "Common Pitfalls",
  "Derivation",
  "Case Study",
  "Diagram Walkthrough",
  "Practice Problem",
  "Edge Cases",
  "Recap & Next Steps",
  "Group Discussion",
  "Quick Check",
];

interface SeedLectureSpec {
  title: string;
  subject: string;
  unit: string;
  topic: string;
  weeksAgo: number;
  slideCount: number;
  highConfusion: boolean; // biases this lecture's marks toward heavier confusion
}

const LECTURE_SPECS: SeedLectureSpec[] = [
  {
    title: "Projectile Motion",
    subject: "Physics",
    unit: "Mechanics",
    topic: "Projectile Motion",
    weeksAgo: 9,
    slideCount: 10,
    highConfusion: false,
  },
  {
    title: "OSI Model Walkthrough",
    subject: "Computer Networks",
    unit: "Foundations",
    topic: "OSI Model",
    weeksAgo: 8,
    slideCount: 10,
    highConfusion: false,
  },
  {
    title: "Heat Engines",
    subject: "Physics",
    unit: "Thermodynamics",
    topic: "Heat Engines",
    weeksAgo: 7,
    slideCount: 12,
    highConfusion: false,
  },
  {
    title: "Entropy & the Second Law",
    subject: "Physics",
    unit: "Thermodynamics",
    topic: "Entropy & Second Law",
    weeksAgo: 5,
    slideCount: 9,
    highConfusion: true,
  },
  {
    title: "Subnetting Basics",
    subject: "Computer Networks",
    unit: "Addressing",
    topic: "Subnetting",
    weeksAgo: 4,
    slideCount: 13,
    highConfusion: true,
  },
  {
    title: "Refraction & Lenses",
    subject: "Physics",
    unit: "Optics",
    topic: "Refraction & Lenses",
    weeksAgo: 3,
    slideCount: 11,
    highConfusion: false,
  },
  {
    title: "Subnetting Practice Session",
    subject: "Computer Networks",
    unit: "Addressing",
    topic: "Subnetting",
    weeksAgo: 2,
    slideCount: 9,
    highConfusion: true,
  },
  {
    title: "Entropy Review & Applications",
    subject: "Physics",
    unit: "Thermodynamics",
    topic: "Entropy & Second Law",
    weeksAgo: 1,
    slideCount: 8,
    highConfusion: true,
  },
];

const SUBJECT_ACCENT: Record<string, string> = {
  Physics: "#3E7CB1",
  "Computer Networks": "#2F6F4F",
};

function isoWeeksAgo(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7 - Math.floor(Math.random() * 3));
  return d.toISOString();
}

function pickReaction(highConfusion: boolean): ReactionType {
  const roll = Math.random();
  if (highConfusion) {
    if (roll < 0.62) return "confused";
    if (roll < 0.85) return "too_fast";
    return "important";
  }
  if (roll < 0.35) return "confused";
  if (roll < 0.6) return "too_fast";
  return "important";
}

export function buildSeedData(): {
  lectures: Lecture[];
  slides: Slide[];
  marks: ConfusionMark[];
} {
  const lectures: Lecture[] = [];
  const slides: Slide[] = [];
  const marks: ConfusionMark[] = [];
  const usedCodes = new Set<string>();

  for (const spec of LECTURE_SPECS) {
    const lectureId = generateId("lec");
    const createdAt = isoWeeksAgo(spec.weeksAgo);
    const joinCode = generateJoinCode(spec.subject, usedCodes);
    usedCodes.add(joinCode);

    const lecture: Lecture = {
      id: lectureId,
      teacherName: SEED_TEACHER_NAME,
      title: spec.title,
      subject: spec.subject,
      unit: spec.unit,
      topic: spec.topic,
      date: createdAt,
      joinCode,
      slideCount: spec.slideCount,
      status: "closed",
      createdAt,
    };
    lectures.push(lecture);

    const accent = SUBJECT_ACCENT[spec.subject] ?? "#2F6F4F";
    const lectureSlides: Slide[] = Array.from({ length: spec.slideCount }, (_, index) => {
      const fragment = HEADING_FRAGMENTS[(index + spec.title.length) % HEADING_FRAGMENTS.length];
      return {
        id: generateId("sl"),
        lectureId,
        index,
        imageUrl: placeholderSlideImage(index, `${spec.topic}: ${fragment}`, accent),
      };
    });
    slides.push(...lectureSlides);

    // Uneven mark spread: 2–3 "hot" slides absorb most of the reactions.
    const shuffled = shuffle(lectureSlides);
    const hotCount = Math.min(3, Math.max(2, Math.round(spec.slideCount / 4)));
    const hotSlides = shuffled.slice(0, hotCount);
    const totalMarks = Math.round(spec.slideCount * (1.8 + Math.random() * 1.2));

    for (let i = 0; i < totalMarks; i += 1) {
      const goesHot = Math.random() < 0.7;
      const pool = goesHot ? hotSlides : shuffled;
      const slide = pool[Math.floor(Math.random() * pool.length)];
      const reaction = pickReaction(spec.highConfusion);
      marks.push({
        id: generateId("mk"),
        lectureId,
        slideId: slide.id,
        studentSessionId: generateId("seed-stu"),
        reaction,
        createdAt,
      });
    }
  }

  return { lectures, slides, marks };
}
