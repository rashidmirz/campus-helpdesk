import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import Document, Ticket, TicketMessage, Notification, User
from app.schemas import DocumentCreate
from app.deps import get_current_user
from app.helpers import get_category_team, DEFAULT_AGENT_FOR_CATEGORY, get_sla_hours
from app.routers.tickets import format_ticket

router = APIRouter(prefix="/documents", tags=["documents"])

@router.get("")
async def get_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.user_id == current_user.id)
    res = await db.execute(stmt)
    docs = res.scalars().all()
    return [{
        "id": d.id,
        "name": d.name,
        "type": d.type,
        "copies": d.copies,
        "note": d.note,
        "status": d.status,
        "ticketId": d.ticket_id
    } for d in docs]

@router.post("", status_code=status.HTTP_201_CREATED)
async def request_document(
    req: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = int(time.time() * 1000)

    # Compute next HD-id
    res = await db.execute(select(Ticket.id))
    all_ids = res.scalars().all()
    max_num = 2000
    for tid in all_ids:
        if tid.startswith("HD-"):
            try:
                num = int(tid[3:])
                if num > max_num:
                    max_num = num
            except ValueError:
                pass
    ticket_id = f"HD-{max_num + 1}"

    desc = f"{req.name}, {req.copies} cop{'y' if req.copies == 1 else 'ies'}.\n{req.note or 'No extra details.'}"
    due_at = now + get_sla_hours("low") * 3600 * 1000
    assignee_id = DEFAULT_AGENT_FOR_CATEGORY.get("cert", "AGT-05")

    ticket = Ticket(
        id=ticket_id,
        subject=f"Request: {req.name}",
        description=desc,
        category="cert",
        priority="low",
        status="new",
        requester_id=current_user.id,
        assignee_id=assignee_id,
        channel="Portal",
        location="",
        tags=["certificate"],
        created_at=now,
        updated_at=now,
        due_at=due_at,
        first_response_at=None,
        resolved_at=None,
        csat_rating=None,
        csat_comment=None
    )
    db.add(ticket)
    await db.flush()

    # Add messages
    db.add(TicketMessage(
        id=f"{ticket_id}-m0",
        ticket_id=ticket_id,
        author_id=current_user.id,
        type="public",
        body=desc,
        at=now
    ))
    db.add(TicketMessage(
        id=f"{ticket_id}-m1",
        ticket_id=ticket_id,
        author_id=None,
        type="system",
        body=f"Request received and routed to {get_category_team('cert')}",
        at=now + 1000
    ))

    # Add Document record
    doc_id = f"doc-{ticket_id}"
    doc = Document(
        id=doc_id,
        user_id=current_user.id,
        type="cert",
        name=req.name,
        copies=req.copies,
        note=req.note or "",
        status="Processing",
        ticket_id=ticket_id
    )
    db.add(doc)

    # Notifications
    db.add(Notification(
        id=f"notif-{now}-adm",
        for_user="ADM-001",
        kind="new",
        title=f"New document request {ticket_id}",
        body=f"Request: {req.name}",
        link=f"/app/tickets/{ticket_id}",
        read=False,
        at=now
    ))

    await db.commit()

    return {
        "id": doc.id,
        "name": doc.name,
        "copies": doc.copies,
        "ticketId": ticket.id,
        "status": doc.status,
        "ticket": format_ticket(ticket, is_admin=(current_user.role == "admin"))
    }
