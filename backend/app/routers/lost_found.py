import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import LostFound, User
from app.schemas import LostFoundCreate
from app.deps import get_current_user

router = APIRouter(prefix="/lost-found", tags=["lost-found"])

def lf_to_dict(item: LostFound) -> dict:
    now = int(time.time() * 1000)
    ago_days = max(0, int((now - item.at) / (86400 * 1000)))
    return {
        "id": item.id,
        "type": item.type,
        "title": item.title,
        "cat": item.cat,
        "place": item.place,
        "desc": item.desc,
        "status": item.status,
        "by": item.by_user,
        "reward": item.reward,
        "at": item.at,
        "ago": ago_days
    }

@router.get("")
async def get_lost_found(db: AsyncSession = Depends(get_db)):
    stmt = select(LostFound).order_by(LostFound.at.desc())
    res = await db.execute(stmt)
    items = res.scalars().all()
    return [lf_to_dict(i) for i in items]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_lost_found(
    req: LostFoundCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = int(time.time() * 1000)
    new_id = f"LF-{int(time.time() * 1000) % 100000}"

    item = LostFound(
        id=new_id,
        type=req.type,
        title=req.title,
        cat=req.cat,
        place=req.place,
        desc=req.desc,
        status="Open",
        by_user=current_user.id,
        reward=req.reward,
        at=now
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return lf_to_dict(item)

@router.post("/{item_id}/claim")
async def claim_lost_found(
    item_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(LostFound).where(LostFound.id == item_id))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")

    item.status = "Claimed"
    await db.commit()
    await db.refresh(item)
    return lf_to_dict(item)
