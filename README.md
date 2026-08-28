# Classroom Doubt Heatmap

Students anonymously flag which slides confused them during a lecture; teachers see a
per-slide confusion heatmap and an AI-generated insight report on where to slow down.

Live in production: frontend on Vercel, backend on Render, both talking to the same
Neon Postgres database.

## Structure

Two services share one Neon Postgres database:

- **`Classroom-Doubt-Heatmap-/`** — Next.js 15 app, deployed on Vercel. Handles auth
  (JWT cookie), PDF upload to Cloudinary, and the teacher's lecture list via its own
  `app/api/*` routes (Prisma).
- **`backend/`** — FastAPI service, deployed on Render. Handles the student lecture
  view, rating submission, the teacher heatmap, and Gemini-powered lecture insights.
  The Next.js app calls it over HTTP (`NEXT_PUBLIC_API_URL`, pointed at the Render
  URL in production).

`backend/app/models.py` (SQLAlchemy) is a manual mirror of
`Classroom-Doubt-Heatmap-/prisma/schema.prisma`. Schema changes always go through
Prisma first (`npx prisma migrate dev`), then get hand-mirrored into `models.py`.

Domain model: `Teacher → Lecture → Slide → ConfusionRating`, plus `LectureInsight`
(cached AI report per lecture).

## Run it locally

Frontend (http://localhost:3000):

```bash
cd Classroom-Doubt-Heatmap-
npm install
npm run dev
```

Backend (http://localhost:8000):

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Both need a `.env` pointing at the same Neon Postgres database — JWT/Cloudinary
secrets for the frontend, `GEMINI_API_KEY`/`INTERNAL_API_SECRET` for the backend. To
hit the local frontend against the production backend (or vice versa), set
`NEXT_PUBLIC_API_URL` / `ALLOWED_ORIGINS` accordingly instead of the localhost
defaults.

## Deploying

- **Frontend (Vercel)**: push to the connected branch; Vercel runs `npm run build`.
  Set `NEON_DB_CONNECTION_STRING`, `JWT_SECRET`, Cloudinary credentials, and
  `NEXT_PUBLIC_API_URL` (the Render backend URL) as Vercel project env vars.
- **Backend (Render)**: push to the connected branch; Render runs
  `pip install -r requirements.txt` and starts `uvicorn app.main:app`. Set
  `DATABASE_URL` (same Neon database), `GEMINI_API_KEY`, `INTERNAL_API_SECRET`, and
  `ALLOWED_ORIGINS` (the Vercel frontend URL) as Render env vars.
- Database schema changes go out via `npx prisma migrate dev` against the shared
  Neon database, then get mirrored by hand into `backend/app/models.py` before the
  backend redeploys.
- `backend/seed.py`, `import_pdf.py`, `simulate_students.py`, and
  `remove_sample_data.py` are local dev/demo utilities only — don't point them at the
  production database.
