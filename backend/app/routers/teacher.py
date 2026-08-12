from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth import get_current_teacher
from app.database import get_db
from app.models import DoubtMark, Lecture, LectureParticipant, Slide, Teacher
from app.schemas import (
    HeatmapCellOut,
    LectureCreateIn,
    LectureDetailOut,
    LectureHeatmapOut,
    LectureOut,
    LectureStatusIn,
    SlideHeatmapOut,
    SlideOut,
    TrendPointOut,
)
from app.utils import generate_join_code, normalize_intensity, save_slide_image

router = APIRouter(prefix="/teacher", tags=["teacher"])


def _lecture_to_out_from_slide_count(lecture: Lecture, teacher_name: str, slide_count: int) -> LectureOut:
    return LectureOut(
        id=lecture.id,
        teacherName=teacher_name,
        title=lecture.title,
        subject=lecture.subject,
        unit=lecture.unit,
        topic=lecture.topic,
        date=lecture.created_at.date().isoformat(),
        joinCode=lecture.join_code,
        slideCount=slide_count,
        status=lecture.status,
        gridRows=lecture.grid_rows,
        gridCols=lecture.grid_cols,
        createdAt=lecture.created_at.isoformat(),
    )


def _lecture_to_out(lecture: Lecture, teacher_name: str) -> LectureOut:
    # Callers must have eagerly loaded `lecture.slides` (e.g. via selectinload)
    # before calling this, otherwise accessing the relationship triggers a
    # lazy load outside of an awaited context and raises MissingGreenlet.
    return _lecture_to_out_from_slide_count(lecture, teacher_name, len(lecture.slides))


async def _get_owned_lecture(db: AsyncSession, lecture_id: str, teacher_id: str) -> Lecture:
    result = await db.execute(
        select(Lecture)
        .options(selectinload(Lecture.slides))
        .where(Lecture.id == lecture_id, Lecture.teacher_id == teacher_id)
    )
    lecture = result.scalar_one_or_none()
    if lecture is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")
    return lecture


@router.post("/lectures", response_model=LectureDetailOut, status_code=status.HTTP_201_CREATED)
async def create_lecture(
    payload: LectureCreateIn,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    if not payload.images:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="At least one slide image is required")

    join_code = await generate_join_code(db, payload.subject)

    lecture = Lecture(
        teacher_id=current_teacher.id,
        title=payload.title,
        subject=payload.subject,
        unit=payload.unit,
        topic=payload.topic,
        join_code=join_code,
        grid_rows=payload.gridRows,
        grid_cols=payload.gridCols,
    )
    db.add(lecture)
    await db.flush()  # assigns lecture.id

    slides: list[Slide] = []
    for index, data_url in enumerate(payload.images):
        slide_number = index + 1
        image_url = save_slide_image(data_url, lecture.id, slide_number)
        slide = Slide(lecture_id=lecture.id, slide_number=slide_number, image_url=image_url)
        db.add(slide)
        slides.append(slide)

    await db.commit()
    await db.refresh(lecture)

    out = _lecture_to_out_from_slide_count(lecture, current_teacher.name, len(slides))
    return LectureDetailOut(
        **out.model_dump(),
        slides=[
            SlideOut(id=s.id, lectureId=lecture.id, index=i, imageUrl=s.image_url)
            for i, s in enumerate(slides)
        ],
    )


@router.get("/lectures", response_model=list[LectureOut])
async def list_lectures(
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lecture)
        .options(selectinload(Lecture.slides))
        .where(Lecture.teacher_id == current_teacher.id)
        .order_by(Lecture.created_at.desc())
    )
    lectures = result.scalars().all()
    return [_lecture_to_out(lecture, current_teacher.name) for lecture in lectures]


@router.get("/lectures/{lecture_id}", response_model=LectureDetailOut)
async def get_lecture(
    lecture_id: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    lecture = await _get_owned_lecture(db, lecture_id, current_teacher.id)
    out = _lecture_to_out(lecture, current_teacher.name)
    return LectureDetailOut(
        **out.model_dump(),
        slides=[
            SlideOut(id=s.id, lectureId=lecture.id, index=i, imageUrl=s.image_url)
            for i, s in enumerate(lecture.slides)
        ],
    )


@router.patch("/lectures/{lecture_id}", response_model=LectureOut)
async def update_lecture_status(
    lecture_id: str,
    payload: LectureStatusIn,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    lecture = await _get_owned_lecture(db, lecture_id, current_teacher.id)
    lecture.status = payload.status
    await db.commit()
    await db.refresh(lecture)
    return _lecture_to_out(lecture, current_teacher.name)


@router.get("/lectures/{lecture_id}/heatmap", response_model=LectureHeatmapOut)
async def get_heatmap(
    lecture_id: str,
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    lecture = await _get_owned_lecture(db, lecture_id, current_teacher.id)

    participants_result = await db.execute(
        select(func.count(LectureParticipant.id)).where(LectureParticipant.lecture_id == lecture.id)
    )
    total_participants = participants_result.scalar_one()

    slides_out: list[SlideHeatmapOut] = []
    for index, slide in enumerate(lecture.slides):
        cell_counts_result = await db.execute(
            select(DoubtMark.row, DoubtMark.col, func.count(DoubtMark.id))
            .where(DoubtMark.slide_id == slide.id)
            .group_by(DoubtMark.row, DoubtMark.col)
        )
        cells = [
            HeatmapCellOut(row=row, col=col, count=count, intensity=normalize_intensity(count, total_participants))
            for row, col, count in cell_counts_result.all()
        ]
        slides_out.append(
            SlideHeatmapOut(
                slideId=slide.id,
                imageUrl=slide.image_url,
                index=index,
                gridRows=lecture.grid_rows,
                gridCols=lecture.grid_cols,
                totalParticipants=total_participants,
                cells=cells,
            )
        )

    return LectureHeatmapOut(lectureId=lecture.id, slides=slides_out)


@router.get("/trends", response_model=list[TrendPointOut])
async def get_trends(
    current_teacher: Teacher = Depends(get_current_teacher),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Lecture)
        .options(selectinload(Lecture.slides), selectinload(Lecture.participants))
        .where(Lecture.teacher_id == current_teacher.id)
        .order_by(Lecture.created_at.asc())
    )
    lectures = result.scalars().all()

    points: list[TrendPointOut] = []
    for lecture in lectures:
        total_participants = len(lecture.participants)

        total_marks_result = await db.execute(
            select(func.count(DoubtMark.id)).join(Slide).where(Slide.lecture_id == lecture.id)
        )
        total_marks = total_marks_result.scalar_one()

        confused_participants_result = await db.execute(
            select(func.count(func.distinct(DoubtMark.participant_id)))
            .join(Slide)
            .where(Slide.lecture_id == lecture.id)
        )
        confused_participants = confused_participants_result.scalar_one()

        confusion_rate = normalize_intensity(confused_participants, total_participants)

        points.append(
            TrendPointOut(
                lectureId=lecture.id,
                title=lecture.title,
                subject=lecture.subject,
                unit=lecture.unit,
                topic=lecture.topic,
                date=lecture.created_at.date().isoformat(),
                confusionRate=confusion_rate,
                totalMarks=total_marks,
                slideCount=len(lecture.slides),
            )
        )

    return points
