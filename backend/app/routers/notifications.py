from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.database import get_db
from app.models import Notification, User
from app.schemas import NotificationReadRequest
from app.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

def notif_to_dict(n: Notification) -> dict:
    return {
        "id": n.id,
        "forUser": n.for_user,
        "kind": n.kind,
        "title": n.title,
        "body": n.body,
        "link": n.link,
        "read": n.read,
        "at": n.at
    }

@router.get("")
async def get_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Notification).where(Notification.for_user == current_user.id).order_by(Notification.at.desc())
    res = await db.execute(stmt)
    notifications = res.scalars().all()
    return [notif_to_dict(n) for n in notifications]

@router.post("/read")
async def mark_notifications_read(
    req: NotificationReadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if req.id == "all":
        stmt = update(Notification).where(Notification.for_user == current_user.id).values(read=True)
    else:
        stmt = update(Notification).where(
            Notification.for_user == current_user.id,
            Notification.id == req.id
        ).values(read=True)
    await db.execute(stmt)
    await db.commit()
    return {"status": "ok"}
