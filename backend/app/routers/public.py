from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models import Ticket, TicketMessage, Agent
from app.helpers import get_status_name, STATUSES_META

router = APIRouter(prefix="/public", tags=["public"])

@router.get("/track/{ticket_id}")
async def track_ticket_public(
    ticket_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Ticket).options(
        selectinload(Ticket.messages)
    ).where(Ticket.id.ilike(ticket_id.strip()))
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No request found for this ID")

    assignee_name = "Awaiting assignment"
    if t.assignee_id:
        ag_res = await db.execute(select(Agent).where(Agent.id == t.assignee_id))
        ag = ag_res.scalar_one_or_none()
        if ag:
            assignee_name = ag.name
        else:
            assignee_name = t.assignee_id

    # Find last public or system message
    last_update = "Request received"
    for m in reversed(t.messages):
        if m.type in ("public", "system"):
            last_update = m.body
            break

    status_meta = STATUSES_META.get(t.status, {"name": t.status, "step": 0, "tone": "info"})

    return {
        "id": t.id,
        "subject": t.subject,
        "status": t.status,
        "statusName": status_meta["name"],
        "statusTone": status_meta["tone"],
        "step": status_meta["step"],
        "assigneeName": assignee_name,
        "createdAt": t.created_at,
        "updatedAt": t.updated_at,
        "dueAt": t.due_at,
        "resolvedAt": t.resolved_at,
        "latestUpdate": last_update
    }
