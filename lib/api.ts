import type { GridCell, Lecture, Slide, SlideAggregate, TrendPoint } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const TOKEN_KEY = "cdh_token";
const TEACHER_NAME_KEY = "cdh_teacher_name";
const PARTICIPANT_KEY = "cdh_participant_id";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(TEACHER_NAME_KEY);
}

export function getTeacherName(): string {
  if (typeof window === "undefined") return "Teacher";
  return window.localStorage.getItem(TEACHER_NAME_KEY) ?? "Teacher";
}

export function setTeacherName(name: string): void {
  window.localStorage.setItem(TEACHER_NAME_KEY, name);
}

/** A stable anonymous ID for this browser, used to scope a student's doubt marks. */
export function getParticipantId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(PARTICIPANT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(PARTICIPANT_KEY, id);
  }
  return id;
}

/** Slide image URLs from the API are host-relative (e.g. "/static/..."); resolve them against the API origin. */
export function resolveImageUrl(url: string): string {
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new ApiError(res.status, detail?.detail ?? `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- Auth ----

export interface TeacherSummary {
  id: string;
  name: string;
  email: string;
}

interface TokenResponse {
  token: string;
  teacher: TeacherSummary;
}

export function signup(name: string, email: string, password: string) {
  return request<TokenResponse>("/auth/signup", { method: "POST", body: { name, email, password } });
}

export function login(email: string, password: string) {
  return request<TokenResponse>("/auth/login", { method: "POST", body: { email, password } });
}

export function getMe() {
  return request<TeacherSummary>("/auth/me", { auth: true });
}

// ---- Teacher lectures ----

export interface LectureDetail extends Lecture {
  slides: Slide[];
}

export function createLecture(input: {
  title: string;
  subject: string;
  unit: string;
  topic: string;
  images: string[];
  gridRows?: number;
  gridCols?: number;
}) {
  return request<LectureDetail>("/teacher/lectures", { method: "POST", body: input, auth: true });
}

export function listLectures() {
  return request<Lecture[]>("/teacher/lectures", { auth: true });
}

export function getLecture(id: string) {
  return request<LectureDetail>(`/teacher/lectures/${id}`, { auth: true });
}

export function setLectureStatus(id: string, status: "open" | "closed") {
  return request<Lecture>(`/teacher/lectures/${id}`, { method: "PATCH", body: { status }, auth: true });
}

export function getHeatmap(lectureId: string) {
  return request<{ lectureId: string; slides: SlideAggregate[] }>(
    `/teacher/lectures/${lectureId}/heatmap`,
    { auth: true }
  );
}

export function getTrends() {
  return request<TrendPoint[]>("/teacher/trends", { auth: true });
}

// ---- Student ----

export interface JoinResult {
  lectureId: string;
  title: string;
  subject: string;
  joinCode: string;
  status: "open" | "closed";
}

export function joinLecture(code: string) {
  const participantId = getParticipantId();
  return request<JoinResult>(`/join/${encodeURIComponent(code)}?participantId=${encodeURIComponent(participantId)}`);
}

export function getStudentSlides(code: string) {
  return request<{ lectureId: string; gridRows: number; gridCols: number; slides: Slide[] }>(
    `/lecture/${encodeURIComponent(code)}/slides`
  );
}

export function setMarks(code: string, slideId: string, cells: GridCell[]) {
  const participantId = getParticipantId();
  return request<{ slideId: string; cells: GridCell[] }>(
    `/lecture/${encodeURIComponent(code)}/slides/${slideId}/marks`,
    { method: "PUT", body: { participantId, cells } }
  );
}
