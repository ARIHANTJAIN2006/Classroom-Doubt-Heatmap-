import type {
  ConfusionMark,
  Lecture,
  ReactionType,
  Slide,
  SlideAggregate,
  TeacherAccount,
  TrendPoint,
} from "./types";
import { generateId, generateJoinCode } from "./utils";
import { buildSeedData, SEED_TEACHER_NAME } from "./mockSeed";

// ---------------------------------------------------------------------------
// Storage keys & low-level read/write. Every localStorage access in the whole
// app funnels through this section. Components never touch localStorage —
// they only ever call the exported functions below.
// ---------------------------------------------------------------------------

const KEYS = {
  teacherName: "cdh:teacherName",
  lectures: "cdh:lectures",
  slides: "cdh:slides",
  marks: "cdh:marks",
  seeded: "cdh:seeded",
  sessions: "cdh:sessions",
  accounts: "cdh:accounts",
  currentEmail: "cdh:currentEmail",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — fail silently, this is a demo mock layer.
  }
}

const readLectures = (): Lecture[] => readJson<Lecture[]>(KEYS.lectures, []);
const writeLectures = (v: Lecture[]) => writeJson(KEYS.lectures, v);

const readSlides = (): Slide[] => readJson<Slide[]>(KEYS.slides, []);
const writeSlides = (v: Slide[]) => writeJson(KEYS.slides, v);

const readMarks = (): ConfusionMark[] => readJson<ConfusionMark[]>(KEYS.marks, []);
const writeMarks = (v: ConfusionMark[]) => writeJson(KEYS.marks, v);

const readSessions = (): Record<string, string> =>
  readJson<Record<string, string>>(KEYS.sessions, {});
const writeSessions = (v: Record<string, string>) => writeJson(KEYS.sessions, v);

const readAccounts = (): TeacherAccount[] => readJson<TeacherAccount[]>(KEYS.accounts, []);
const writeAccounts = (v: TeacherAccount[]) => writeJson(KEYS.accounts, v);

// ---------------------------------------------------------------------------
// Seeding. Runs once per browser (guarded by the `cdh:seeded` flag) so a demo
// always opens with a populated dashboard and trends page.
// ---------------------------------------------------------------------------

function ensureSeeded(): void {
  if (!isBrowser()) return;
  if (window.localStorage.getItem(KEYS.seeded) === "true") return;

  const { lectures, slides, marks } = buildSeedData();
  writeLectures(lectures);
  writeSlides(slides);
  writeMarks(marks);
  window.localStorage.setItem(KEYS.seeded, "true");
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

const CONFUSION_WEIGHT: Record<ReactionType, number> = {
  confused: 1,
  too_fast: 0.5,
  important: 0,
};

function computeAggregates(slides: Slide[], marks: ConfusionMark[]): SlideAggregate[] {
  const bySlide = new Map<string, ConfusionMark[]>();
  for (const m of marks) {
    const list = bySlide.get(m.slideId) ?? [];
    list.push(m);
    bySlide.set(m.slideId, list);
  }

  const raw = slides.map((s) => {
    const slideMarks = bySlide.get(s.id) ?? [];
    const breakdown: Record<ReactionType, number> = {
      confused: 0,
      too_fast: 0,
      important: 0,
    };
    for (const m of slideMarks) breakdown[m.reaction] += 1;
    const weighted =
      breakdown.confused * CONFUSION_WEIGHT.confused +
      breakdown.too_fast * CONFUSION_WEIGHT.too_fast +
      breakdown.important * CONFUSION_WEIGHT.important;
    return {
      slideId: s.id,
      index: s.index,
      imageUrl: s.imageUrl,
      totalMarks: slideMarks.length,
      breakdown,
      _weighted: weighted,
    };
  });

  const maxWeighted = Math.max(1, ...raw.map((r) => r._weighted));

  return raw
    .map((r) => ({
      slideId: r.slideId,
      index: r.index,
      imageUrl: r.imageUrl,
      totalMarks: r.totalMarks,
      breakdown: r.breakdown,
      intensity: maxWeighted > 0 ? r._weighted / maxWeighted : 0,
    }))
    .sort((a, b) => a.index - b.index);
}

// ---------------------------------------------------------------------------
// Public API — required functions
// ---------------------------------------------------------------------------

export async function getLectures(teacherName: string): Promise<Lecture[]> {
  ensureSeeded();
  return readLectures()
    .filter((l) => l.teacherName === teacherName)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function getLectureById(
  id: string
): Promise<{ lecture: Lecture; aggregates: SlideAggregate[] }> {
  ensureSeeded();
  const lecture = readLectures().find((l) => l.id === id);
  if (!lecture) throw new Error("Lecture not found");
  const slides = readSlides()
    .filter((s) => s.lectureId === id)
    .sort((a, b) => a.index - b.index);
  const marks = readMarks().filter((m) => m.lectureId === id);
  return { lecture, aggregates: computeAggregates(slides, marks) };
}

export async function createLecture(
  pdfPages: string[],
  meta: { title: string; subject: string; unit: string; topic: string; teacherName: string }
): Promise<Lecture> {
  ensureSeeded();
  const existingCodes = new Set(readLectures().map((l) => l.joinCode));
  const now = new Date().toISOString();
  const lecture: Lecture = {
    id: generateId("lec"),
    teacherName: meta.teacherName,
    title: meta.title,
    subject: meta.subject,
    unit: meta.unit,
    topic: meta.topic,
    date: now,
    joinCode: generateJoinCode(meta.subject, existingCodes),
    slideCount: pdfPages.length,
    status: "open",
    createdAt: now,
  };
  const slides: Slide[] = pdfPages.map((imageUrl, index) => ({
    id: generateId("sl"),
    lectureId: lecture.id,
    index,
    imageUrl,
  }));

  writeLectures([...readLectures(), lecture]);
  writeSlides([...readSlides(), ...slides]);
  return lecture;
}

export async function setLectureStatus(
  id: string,
  status: "open" | "closed"
): Promise<void> {
  const updated = readLectures().map((l) => (l.id === id ? { ...l, status } : l));
  writeLectures(updated);
}

export async function getLectureByCode(
  code: string
): Promise<{ lecture: Lecture; slides: Slide[] }> {
  ensureSeeded();
  const normalized = code.trim().toUpperCase();
  const lecture = readLectures().find((l) => l.joinCode.toUpperCase() === normalized);
  if (!lecture) throw new Error("NOT_FOUND");
  const slides = readSlides()
    .filter((s) => s.lectureId === lecture.id)
    .sort((a, b) => a.index - b.index);
  return { lecture, slides };
}

export async function submitMark(
  lectureId: string,
  slideId: string,
  sessionId: string,
  reaction: ReactionType
): Promise<void> {
  const marks = readMarks();
  const exists = marks.some(
    (m) =>
      m.lectureId === lectureId &&
      m.slideId === slideId &&
      m.studentSessionId === sessionId &&
      m.reaction === reaction
  );
  if (exists) return;
  const mark: ConfusionMark = {
    id: generateId("mk"),
    lectureId,
    slideId,
    studentSessionId: sessionId,
    reaction,
    createdAt: new Date().toISOString(),
  };
  writeMarks([...marks, mark]);
}

export async function removeMark(
  lectureId: string,
  slideId: string,
  sessionId: string,
  reaction: ReactionType
): Promise<void> {
  const marks = readMarks().filter(
    (m) =>
      !(
        m.lectureId === lectureId &&
        m.slideId === slideId &&
        m.studentSessionId === sessionId &&
        m.reaction === reaction
      )
  );
  writeMarks(marks);
}

export async function getSemesterTrends(
  teacherName: string,
  filters?: { subject?: string; unit?: string }
): Promise<TrendPoint[]> {
  ensureSeeded();
  let lectures = readLectures().filter((l) => l.teacherName === teacherName);
  if (filters?.subject) lectures = lectures.filter((l) => l.subject === filters.subject);
  if (filters?.unit) lectures = lectures.filter((l) => l.unit === filters.unit);

  const slides = readSlides();
  const marks = readMarks();

  const points: TrendPoint[] = lectures.map((l) => {
    const lectureSlides = slides.filter((s) => s.lectureId === l.id);
    const lectureMarks = marks.filter((m) => m.lectureId === l.id);
    const confused = lectureMarks.filter((m) => m.reaction === "confused").length;
    const tooFast = lectureMarks.filter((m) => m.reaction === "too_fast").length;
    const weighted = confused * 1 + tooFast * 0.5;
    const slideCount = lectureSlides.length || 1;
    // Normalize against a generous per-slide ceiling so the rate reads as a
    // meaningful 0–1 share rather than an unbounded count.
    const confusionRate = Math.max(0, Math.min(1, weighted / (slideCount * 1.6)));
    return {
      lectureId: l.id,
      title: l.title,
      subject: l.subject,
      unit: l.unit,
      topic: l.topic,
      date: l.date,
      confusionRate,
      totalMarks: lectureMarks.length,
      slideCount: lectureSlides.length,
    };
  });

  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export async function seedRandomMarks(lectureId: string, count: number): Promise<void> {
  const slides = readSlides().filter((s) => s.lectureId === lectureId);
  if (slides.length === 0) return;

  const shuffled = [...slides].sort(() => Math.random() - 0.5);
  const hotCount = Math.min(3, Math.max(2, Math.round(slides.length / 4)));
  const hotSlides = shuffled.slice(0, hotCount);

  const marks = readMarks();
  const added: ConfusionMark[] = [];
  for (let i = 0; i < count; i += 1) {
    const useHot = Math.random() < 0.7;
    const pool = useHot ? hotSlides : shuffled;
    const slide = pool[Math.floor(Math.random() * pool.length)];
    const roll = Math.random();
    const reaction: ReactionType = useHot
      ? roll < 0.65
        ? "confused"
        : roll < 0.9
        ? "too_fast"
        : "important"
      : roll < 0.35
      ? "confused"
      : roll < 0.6
      ? "too_fast"
      : "important";

    added.push({
      id: generateId("mk"),
      lectureId,
      slideId: slide.id,
      studentSessionId: generateId("demo-session"),
      reaction,
      createdAt: new Date().toISOString(),
    });
  }

  writeMarks([...marks, ...added]);
}

export async function resetAllMockData(): Promise<void> {
  if (!isBrowser()) return;
  const currentTeacherName = window.localStorage.getItem(KEYS.teacherName);

  window.localStorage.removeItem(KEYS.lectures);
  window.localStorage.removeItem(KEYS.slides);
  window.localStorage.removeItem(KEYS.marks);
  window.localStorage.removeItem(KEYS.sessions);
  window.localStorage.removeItem(KEYS.seeded);

  ensureSeeded();

  // Keep the demo smooth: re-attach the freshly seeded lectures to whoever is
  // currently logged in, rather than logging them out into an empty state.
  if (currentTeacherName) {
    const reassigned = readLectures().map((l) =>
      l.teacherName === SEED_TEACHER_NAME ? { ...l, teacherName: currentTeacherName } : l
    );
    writeLectures(reassigned);
  }
}

// ---------------------------------------------------------------------------
// Small additional helpers. Still storage-backed, still funnel through here.
// ---------------------------------------------------------------------------

export async function getTeacherName(): Promise<string | null> {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(KEYS.teacherName);
}

export async function setTeacherName(name: string): Promise<void> {
  if (!isBrowser()) return;
  const isFirstLogin = !window.localStorage.getItem(KEYS.teacherName);
  window.localStorage.setItem(KEYS.teacherName, name);
  ensureSeeded();

  if (isFirstLogin) {
    // Hand the freshly seeded demo history to the first name anyone enters,
    // so the very first dashboard view already tells a story.
    const reassigned = readLectures().map((l) =>
      l.teacherName === SEED_TEACHER_NAME ? { ...l, teacherName: name } : l
    );
    writeLectures(reassigned);
  }
}

export async function getOrCreateStudentSession(lectureId: string): Promise<string> {
  const sessions = readSessions();
  if (sessions[lectureId]) return sessions[lectureId];
  const id = generateId("stu");
  writeSessions({ ...sessions, [lectureId]: id });
  return id;
}

export async function getSessionMarks(
  lectureId: string,
  sessionId: string
): Promise<ConfusionMark[]> {
  return readMarks().filter(
    (m) => m.lectureId === lectureId && m.studentSessionId === sessionId
  );
}

// ---------------------------------------------------------------------------
// Mock accounts. There is no real backend, no hashing, no server-side check —
// this exists purely so the app has real /login and /signup pages instead of
// a bare name field. Treat it as a demo, not a security model.
// ---------------------------------------------------------------------------

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function signUpTeacher(
  name: string,
  email: string,
  password: string
): Promise<{ name: string }> {
  const normalized = normalizeEmail(email);
  const accounts = readAccounts();
  if (accounts.some((a) => a.email === normalized)) {
    throw new Error("An account with that email already exists — try logging in instead.");
  }

  const account: TeacherAccount = {
    id: generateId("acct"),
    name: name.trim(),
    email: normalized,
    password,
    createdAt: new Date().toISOString(),
  };
  writeAccounts([...accounts, account]);

  await setTeacherName(account.name);
  if (isBrowser()) window.localStorage.setItem(KEYS.currentEmail, normalized);

  return { name: account.name };
}

export async function logInTeacher(
  email: string,
  password: string
): Promise<{ name: string }> {
  const normalized = normalizeEmail(email);
  const account = readAccounts().find((a) => a.email === normalized);
  if (!account) {
    throw new Error("No account found with that email — try signing up instead.");
  }
  if (account.password !== password) {
    throw new Error("That password doesn't match.");
  }

  await setTeacherName(account.name);
  if (isBrowser()) window.localStorage.setItem(KEYS.currentEmail, normalized);

  return { name: account.name };
}

export async function logOutTeacher(): Promise<void> {
  if (!isBrowser()) return;
  // Signing out clears the active session only — lecture data stays put,
  // since it's keyed by teacher name, not by this session.
  window.localStorage.removeItem(KEYS.teacherName);
  window.localStorage.removeItem(KEYS.currentEmail);
}

export async function getCurrentEmail(): Promise<string | null> {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(KEYS.currentEmail);
}
