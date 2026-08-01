# Classroom Doubt Heatmap — frontend

A mock-data-only Next.js (App Router) frontend. No backend, no real auth — every
read/write goes through `lib/mockApi.ts`, which persists to `localStorage`. Swapping
in a real backend later means rewriting that one file, not the UI.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. On first load you'll see a "Demo Teacher" semester's
worth of seeded lectures — enter any name at the front door and that seeded history
gets attached to you, so the dashboard and trends page aren't empty on first look.

## Notes on how this was built

This source tree was hand-written and reviewed line-by-line, but **it has not been
run through `npm install` / `next build` / `next dev`** — it was produced in a sandbox
with no network access, so the toolchain itself (Next.js, Tailwind, recharts,
pdfjs-dist, qrcode.react) couldn't be installed or compiled here. I checked import
paths, prop shapes, Tailwind tokens, and TypeScript types manually, but a first
`npm install && npm run dev` on your machine is the real compile check. If anything
doesn't build, it's most likely one of:

- A version mismatch in `package.json` (pin versions you know work if `^` ranges
  pull something newer that changed an API).
- `pdfjs-dist`'s worker loading — it currently points at a CDN copy of the matching
  worker version (`cdnjs.cloudflare.com`). If you're offline or want it bundled,
  switch to a local worker import instead (see comment in `UploadDropzone.tsx`).

## Where things live

- `lib/types.ts` — the data model (matches the brief exactly, including the unused
  `x`/`y` fields on `ConfusionMark` reserved for future region-level marking), plus
  a `TeacherAccount` type for the mock login/signup system.
- `lib/mockApi.ts` — the only file that touches `localStorage`. All 10 required
  functions plus a few small helpers (session handling, teacher name, and the mock
  `signUpTeacher` / `logInTeacher` / `logOutTeacher` pair).
- `lib/mockSeed.ts` — builds the seeded semester: 8 lectures across Physics and
  Computer Networks over the last 10 weeks, with "Entropy & Second Law" and
  "Subnetting" deliberately recurring so the trends page's "consistently confusing
  topics" ranking has real signal instead of one noisy lecture.
- `components/` — the 9 required components, plus two extras (`TeacherHeader` for
  shared nav + logout, and nothing else added there).
- `app/` — the 8 required routes, plus `/login` and `/signup` for teachers.

## About the login/signup pages

These are **mock, demo-only** — there's still no real backend. `signUpTeacher` /
`logInTeacher` store an account record (name, email, plaintext password) in
`localStorage` and check against it; there's no hashing, no server-side validation,
and anyone with browser dev tools can read the "password." The pages say this
plainly so it doesn't look more secure than it is. Students still never log in —
their anonymity is the whole point of the product, so `/join` stays untouched.

## Demo flow

1. `/` → "I'm a teacher" → `/login` (or `/signup` if you don't have an account yet)
   → `/teacher` (seeded lectures already there on first signup).
2. `/teacher/upload` → drop a PDF, fill in title/subject/unit/topic → get a join code.
3. On another device (or same one, in an incognito tab) → `/join` → enter the code →
   react slide-by-slide → `/lecture/[code]/done`.
4. Back on `/teacher/lecture/[id]`, hit **Simulate student responses** to see the
   heatmap fill in live without needing a second device.
5. `/teacher/trends` to see the semester view, filterable by subject/unit.
6. "Reset demo data" in the dashboard footer wipes and re-seeds cleanly.
