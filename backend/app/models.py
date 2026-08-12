import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    lectures: Mapped[list["Lecture"]] = relationship(back_populates="teacher", cascade="all, delete-orphan")


class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    teacher_id: Mapped[str] = mapped_column(ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="")
    topic: Mapped[str] = mapped_column(String, nullable=False, default="")
    join_code: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        Enum("open", "closed", name="lecture_status"), nullable=False, default="open"
    )
    grid_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    grid_cols: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    teacher: Mapped["Teacher"] = relationship(back_populates="lectures")
    slides: Mapped[list["Slide"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan", order_by="Slide.slide_number"
    )
    participants: Mapped[list["LectureParticipant"]] = relationship(
        back_populates="lecture", cascade="all, delete-orphan"
    )


class Slide(Base):
    __tablename__ = "slides"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    lecture_id: Mapped[str] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    slide_number: Mapped[int] = mapped_column(Integer, nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    lecture: Mapped["Lecture"] = relationship(back_populates="slides")
    marks: Mapped[list["DoubtMark"]] = relationship(back_populates="slide", cascade="all, delete-orphan")


class LectureParticipant(Base):
    __tablename__ = "lecture_participants"
    __table_args__ = (UniqueConstraint("lecture_id", "participant_id", name="uq_lecture_participant"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    lecture_id: Mapped[str] = mapped_column(ForeignKey("lectures.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    lecture: Mapped["Lecture"] = relationship(back_populates="participants")


class DoubtMark(Base):
    __tablename__ = "doubt_marks"
    __table_args__ = (
        UniqueConstraint("slide_id", "participant_id", "row", "col", name="uq_slide_participant_cell"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    slide_id: Mapped[str] = mapped_column(ForeignKey("slides.id", ondelete="CASCADE"), nullable=False)
    participant_id: Mapped[str] = mapped_column(String, nullable=False, index=True)
    row: Mapped[int] = mapped_column(Integer, nullable=False)
    col: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    slide: Mapped["Slide"] = relationship(back_populates="marks")
