import type { TrendPoint, TopicConsistency } from "./types";

/** Joins truthy class names together. Kept dependency-free on purpose. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function generateId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 9);
  const time = Date.now().toString(36);
  return `${prefix}_${time}${rand}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Deterministic-ish uppercase join code, e.g. "PHY-482". */
export function generateJoinCode(subject: string, taken: Set<string>): string {
  const letters = subject
    .replace(/[^a-zA-Z]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");

  let code = "";
  let attempts = 0;
  do {
    const digits = Math.floor(100 + Math.random() * 900);
    code = `${letters}-${digits}`;
    attempts += 1;
  } while (taken.has(code) && attempts < 50);

  return code;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

const HEAT_COOL = hexToRgb("#3E7CB1");
const HEAT_AMBER = hexToRgb("#E8A33D");
const HEAT_RED = hexToRgb("#D6432F");

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/**
 * Maps a 0–1 confusion intensity to a color along the reserved heat scale:
 * cool blue -> amber -> red. This scale is used exclusively for confusion
 * data, never for decoration.
 */
export function getHeatColor(intensity: number): string {
  const t = clamp(intensity, 0, 1);
  const [from, to, localT] =
    t < 0.5 ? [HEAT_COOL, HEAT_AMBER, t / 0.5] : [HEAT_AMBER, HEAT_RED, (t - 0.5) / 0.5];
  const r = lerp(from.r, to.r, localT);
  const g = lerp(from.g, to.g, localT);
  const b = lerp(from.b, to.b, localT);
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Groups trend points by subject + topic and surfaces topics that recur
 * across two or more lectures — the "not just one bad day" signal.
 * Pure function: operates only on data already returned by mockApi.
 */
export function computeTopicConsistency(points: TrendPoint[]): TopicConsistency[] {
  const groups = new Map<string, TrendPoint[]>();
  for (const p of points) {
    const key = `${p.subject}::${p.topic}`;
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }

  const results: TopicConsistency[] = [];
  for (const [key, list] of groups.entries()) {
    if (list.length < 2) continue;
    const [subject, topic] = key.split("::");
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const avg = sorted.reduce((sum, p) => sum + p.confusionRate, 0) / sorted.length;
    const first = sorted[0].confusionRate;
    const last = sorted[sorted.length - 1].confusionRate;
    const delta = last - first;
    const trend: TopicConsistency["trend"] =
      delta > 0.08 ? "rising" : delta < -0.08 ? "falling" : "stable";
    results.push({
      subject,
      topic,
      lectureCount: sorted.length,
      avgConfusionRate: avg,
      trend,
    });
  }

  return results.sort((a, b) => b.avgConfusionRate - a.avgConfusionRate);
}
