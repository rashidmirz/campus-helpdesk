import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Announcement, User
from app.schemas import AnnouncementCreate
from app.deps import get_current_user, require_admin

router = APIRouter(prefix="/announcements", tags=["announcements"])

def ann_to_dict(a: Announcement) -> dict:
    return {
        "id": a.id,
        "tone": a.tone,
        "pinned": a.pinned,
        "title": a.title,
        "body": a.body,
        "by": a.by_name,
        "at": a.at
    }

@router.get("")
async def get_announcements(db: AsyncSession = Depends(get_db)):
    stmt = select(Announcement).order_by(Announcement.pinned.desc(), Announcement.at.desc())
    res = await db.execute(stmt)
    announcements = res.scalars().all()
    return [ann_to_dict(a) for a in announcements]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_announcement(
    req: AnnouncementCreate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    now = int(time.time() * 1000)
    aid = f"an-{now % 100000}"

    ann = Announcement(
        id=aid,
        title=req.title,
        body=req.body,
        tone=req.tone,
        pinned=req.pinned,
        by_name=current_user.name,
        audience=req.audience or "all",
        at=now
    )
    db.add(ann)
    await db.commit()
    await db.refresh(ann)
    return ann_to_dict(ann)

@router.delete("/{ann_id}")
async def delete_announcement(
    ann_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Announcement).where(Announcement.id == ann_id))
    ann = res.scalar_one_or_none()
    if not ann:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")

    await db.delete(ann)
    await db.commit()
    return {"message": "Announcement deleted"}
