from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import DoubtMark, Lecture, LectureParticipant, Slide
from app.schemas import CellIn, JoinOut, MarksIn, MarksOut, SlideOut, StudentSlidesOut

router = APIRouter(tags=["student"])


async def _get_lecture_by_code(db: AsyncSession, code: str) -> Lecture:
    result = await db.execute(
        select(Lecture).options(selectinload(Lecture.slides)).where(Lecture.join_code == code.upper())
    )
    lecture = result.scalar_one_or_none()
    if lecture is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")
    return lecture


@router.get("/join/{code}", response_model=JoinOut)
async def join_lecture(code: str, participantId: str, db: AsyncSession = Depends(get_db)):
    lecture = await _get_lecture_by_code(db, code)
    if lecture.status != "open":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This lecture is closed")

    existing = await db.execute(
        select(LectureParticipant).where(
            LectureParticipant.lecture_id == lecture.id,
            LectureParticipant.participant_id == participantId,
        )
    )
    if existing.scalar_one_or_none() is None:
        db.add(LectureParticipant(lecture_id=lecture.id, participant_id=participantId))
        await db.commit()

    return JoinOut(
        lectureId=lecture.id,
        title=lecture.title,
        subject=lecture.subject,
        joinCode=lecture.join_code,
        status=lecture.status,
    )


@router.get("/lecture/{code}/slides", response_model=StudentSlidesOut)
async def get_slides(code: str, db: AsyncSession = Depends(get_db)):
    lecture = await _get_lecture_by_code(db, code)
    return StudentSlidesOut(
        lectureId=lecture.id,
        gridRows=lecture.grid_rows,
        gridCols=lecture.grid_cols,
        slides=[
            SlideOut(id=s.id, lectureId=lecture.id, index=i, imageUrl=s.image_url)
            for i, s in enumerate(lecture.slides)
        ],
    )


@router.put("/lecture/{code}/slides/{slide_id}/marks", response_model=MarksOut)
async def set_marks(code: str, slide_id: str, payload: MarksIn, db: AsyncSession = Depends(get_db)):
    lecture = await _get_lecture_by_code(db, code)
    if lecture.status != "open":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This lecture is closed")

    slide_result = await db.execute(
        select(Slide).where(Slide.id == slide_id, Slide.lecture_id == lecture.id)
    )
    slide = slide_result.scalar_one_or_none()
    if slide is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slide not found")

    for cell in payload.cells:
        if not (0 <= cell.row < lecture.grid_rows) or not (0 <= cell.col < lecture.grid_cols):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Cell out of grid bounds")

    await db.execute(
        delete(DoubtMark).where(
            DoubtMark.slide_id == slide.id,
            DoubtMark.participant_id == payload.participantId,
        )
    )
    for cell in payload.cells:
        db.add(DoubtMark(slide_id=slide.id, participant_id=payload.participantId, row=cell.row, col=cell.col))

    await db.commit()

    return MarksOut(slideId=slide.id, cells=[CellIn(row=c.row, col=c.col) for c in payload.cells])
