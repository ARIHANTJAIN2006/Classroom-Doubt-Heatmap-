from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---- Auth ----

class SignupIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    token: str
    teacher: "TeacherOut"


class TeacherOut(BaseModel):
    id: str
    name: str
    email: str

    model_config = {"from_attributes": True}


# ---- Lectures ----

class LectureCreateIn(BaseModel):
    title: str
    subject: str
    unit: str = ""
    topic: str = ""
    gridRows: int = Field(default=10, ge=1, le=40)
    gridCols: int = Field(default=8, ge=1, le=40)
    images: list[str]  # base64 data URLs, one per slide, in order


class SlideOut(BaseModel):
    id: str
    lectureId: str
    index: int
    imageUrl: str


class LectureOut(BaseModel):
    id: str
    teacherName: str
    title: str
    subject: str
    unit: str
    topic: str
    date: str
    joinCode: str
    slideCount: int
    status: str
    gridRows: int
    gridCols: int
    createdAt: str


class LectureDetailOut(LectureOut):
    slides: list[SlideOut]


class LectureStatusIn(BaseModel):
    status: str = Field(pattern="^(open|closed)$")


# ---- Join / student ----

class JoinOut(BaseModel):
    lectureId: str
    title: str
    subject: str
    joinCode: str
    status: str


class StudentSlidesOut(BaseModel):
    lectureId: str
    gridRows: int
    gridCols: int
    slides: list[SlideOut]


class CellIn(BaseModel):
    row: int
    col: int


class MarksIn(BaseModel):
    participantId: str
    cells: list[CellIn]


class MarksOut(BaseModel):
    slideId: str
    cells: list[CellIn]


# ---- Heatmap / trends ----

class HeatmapCellOut(BaseModel):
    row: int
    col: int
    count: int
    intensity: float


class SlideHeatmapOut(BaseModel):
    slideId: str
    imageUrl: str
    index: int
    gridRows: int
    gridCols: int
    totalParticipants: int
    cells: list[HeatmapCellOut]


class LectureHeatmapOut(BaseModel):
    lectureId: str
    slides: list[SlideHeatmapOut]


class TrendPointOut(BaseModel):
    lectureId: str
    title: str
    subject: str
    unit: str
    topic: str
    date: str
    confusionRate: float
    totalMarks: int
    slideCount: int
