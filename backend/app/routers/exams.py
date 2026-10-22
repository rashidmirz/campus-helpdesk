from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Exam, User
from app.deps import get_current_user

router = APIRouter(prefix="/exams", tags=["exams"])

def exam_to_dict(e: Exam) -> dict:
    return {
        "id": e.id,
        "code": e.code,
        "name": e.name,
        "in": e.in_days,
        "time": e.time,
        "hall": e.hall,
        "seat": e.seat,
        "credits": e.credits,
        "kind": e.kind,
        "course": e.course,
        "hall_ticket_status": e.hall_ticket_status
    }

@router.get("")
async def get_exams(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Exam).order_by(Exam.in_days.asc())
    res = await db.execute(stmt)
    exams = res.scalars().all()
    return [exam_to_dict(e) for e in exams]
