from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, student, teacher

Path(settings.static_dir).mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Classroom Doubt Heatmap API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")

app.include_router(auth.router)
app.include_router(teacher.router)
app.include_router(student.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
