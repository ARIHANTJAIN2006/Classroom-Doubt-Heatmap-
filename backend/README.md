# Classroom Doubt Heatmap — FastAPI backend

Serves the `Classroom-Doubt-Heatmap-` Next.js frontend: teacher auth, lecture/slide
upload, student join-code + grid-cell doubt marking, and heatmap/trend aggregation.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env         # then fill in DATABASE_URL (Neon Postgres) and JWT_SECRET
alembic upgrade head
uvicorn app.main:app --reload
```

API docs at http://localhost:8000/docs once running.

## Data model

- `Teacher` — account, email+password (bcrypt hashed)
- `Lecture` — owned by a Teacher; has `join_code`, `status` (open/closed), and a
  fixed `grid_rows` x `grid_cols` overlay applied to every slide
- `Slide` — one image per PDF page (PNGs saved under `static/slides/{lecture_id}/`)
- `LectureParticipant` — one row per anonymous student who joined (denominator for
  heatmap/trend normalization)
- `DoubtMark` — one row per (slide, participant, grid cell) the student marked

## Key endpoints

- `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`
- `POST /teacher/lectures` — create lecture from title/subject/unit/topic + an
  ordered array of base64 PNG slide images (as produced by the frontend's
  `UploadDropzone`, which renders the PDF client-side via `pdfjs-dist`)
- `GET /teacher/lectures`, `GET /teacher/lectures/{id}`, `PATCH /teacher/lectures/{id}`
- `GET /teacher/lectures/{id}/heatmap` — per-slide grid cell counts + normalized intensity
- `GET /teacher/trends`
- `GET /join/{code}?participantId=...` — validate + record join
- `GET /lecture/{code}/slides`
- `PUT /lecture/{code}/slides/{slide_id}/marks` — replaces a participant's marked cells

## Notes

- Auth: JWT bearer tokens for teachers. Students are never registered — the
  frontend generates a random `participantId` (e.g. `crypto.randomUUID()`) and
  persists it in `localStorage`, sent on every join/mark request.
- This service owns the Postgres schema going forward (via Alembic). It targets
  the same Neon Postgres database referenced by the Next.js app's
  `NEON_DB_CONNECTION_STRING`, but replaces the old Prisma-managed tables with
  the grid-based schema above — run `alembic upgrade head` against a fresh
  database (or drop the old Prisma-created tables first) rather than mixing
  the two schemas.
