from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Event, EventRegistration, User
from app.deps import get_current_user

router = APIRouter(prefix="/events", tags=["events"])

def event_to_dict(e: Event, is_reg: bool = False) -> dict:
    return {
        "id": e.id,
        "title": e.title,
        "tag": e.tag,
        "in": e.in_days,
        "time": e.time,
        "venue": e.venue,
        "capacity": e.capacity,
        "registered": e.registered_count,
        "desc": e.description,
        "isRegistered": is_reg
    }

@router.get("")
async def get_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    events_res = await db.execute(select(Event).order_by(Event.in_days.asc()))
    events = events_res.scalars().all()

    regs_res = await db.execute(select(EventRegistration.event_id).where(EventRegistration.user_id == current_user.id))
    user_regs = set(regs_res.scalars().all())

    return [event_to_dict(e, e.id in user_regs) for e in events]

@router.post("/{event_id}/register")
async def toggle_event_registration(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ev_res = await db.execute(select(Event).where(Event.id == event_id))
    event = ev_res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    reg_res = await db.execute(
        select(EventRegistration).where(
            EventRegistration.user_id == current_user.id,
            EventRegistration.event_id == event_id
        )
    )
    existing_reg = reg_res.scalar_one_or_none()

    if existing_reg:
        # Unregister
        await db.delete(existing_reg)
        event.registered_count = max(0, event.registered_count - 1)
        is_registered = False
    else:
        # Register
        if event.registered_count >= event.capacity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is already at full capacity")
        db.add(EventRegistration(user_id=current_user.id, event_id=event_id))
        event.registered_count += 1
        is_registered = True

    await db.commit()
    await db.refresh(event)
    return {
        "registered": is_registered,
        "registered_count": event.registered_count
    }
