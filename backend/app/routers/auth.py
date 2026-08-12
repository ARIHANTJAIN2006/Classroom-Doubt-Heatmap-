from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import create_access_token, get_current_teacher, hash_password, verify_password
from app.database import get_db
from app.models import Teacher
from app.schemas import LoginIn, SignupIn, TeacherOut, TokenOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenOut)
async def signup(payload: SignupIn, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Teacher).where(Teacher.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    teacher = Teacher(name=payload.name, email=payload.email, password_hash=hash_password(payload.password))
    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)

    token = create_access_token(teacher.id)
    return TokenOut(token=token, teacher=TeacherOut.model_validate(teacher))


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Teacher).where(Teacher.email == payload.email))
    teacher = result.scalar_one_or_none()
    if teacher is None or not verify_password(payload.password, teacher.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(teacher.id)
    return TokenOut(token=token, teacher=TeacherOut.model_validate(teacher))


@router.get("/me", response_model=TeacherOut)
async def me(current_teacher: Teacher = Depends(get_current_teacher)):
    return TeacherOut.model_validate(current_teacher)
